const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the real TypeScript modules with isolated environments and mocked I/O.
function loader(env = {}, fetch = async () => { throw new Error('Unexpected network call'); }, suffix = {}) {
  const modules = new Map();
  function load(name) {
    const file = path.resolve(__dirname, '..', name);
    if (modules.has(file)) return modules.get(file).exports;
    const loaded = { exports: {} }; modules.set(file, loaded);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8') + (suffix[name] || ''), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      module: loaded, exports: loaded.exports, process: { env }, Buffer, URL, URLSearchParams,
      Request, Response, Headers, AbortSignal, console, fetch,
      require: id => id.startsWith('.') ? load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(file), id + '.ts'))) : require(id),
    }, { filename: file });
    return loaded.exports;
  }
  return load;
}
const storeEnv = { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'dummy', YT_API_KEY: 'dummy' };
function fakeStore() {
  const values = new Map(); let searches = 0;
  const fetch = async (url, options) => {
    if (String(url).startsWith('https://redis.test')) {
      const c = JSON.parse(options.body); let result;
      if (c[0] === 'GET') result = values.get(c[1]) ?? null;
      else if (c[0] === 'SET') {
        if (c.includes('NX') && values.has(c[1])) result = null;
        else { values.set(c[1], c[2]); result = 'OK'; }
      } else if (c[0] === 'EVAL' && c[1].includes('INCRBY')) {
        const used = Number(values.get(c[3]) || 0);
        result = used + Number(c[4]) <= Number(c[5]) ? 1 : 0;
        if (result) values.set(c[3], used + Number(c[4]));
      } else if (c[0] === 'EVAL') {
        result = values.get(c[3]) === c[4] ? 1 : 0;
        if (result) values.delete(c[3]);
      } else throw new Error('Unexpected Redis command');
      return Response.json({ result });
    }
    searches++;
    return Response.json({ items: [] });
  };
  return { fetch, values, searches: () => searches };
}

test('signed clip claims reject tampering, expiry, and weak/missing secrets', () => {
  const env = { SHORTS_SIGNING_SECRET: 'x'.repeat(32) };
  const tokenModule = loader(env)('lib/short-token.ts');
  const token = tokenModule.signShort('Audit Title', '2026', 'movie');
  assert.equal(tokenModule.verifyShort(token).title, 'Audit Title');
  const parts = token.split('.');
  parts[0] = Buffer.from(JSON.stringify({ title: 'Other Title', year: '2026', kind: 'movie', expires: Date.now() + 5000 })).toString('base64url');
  assert.equal(tokenModule.verifyShort(parts.join('.')), null);
  const crypto = require('node:crypto');
  const expired = Buffer.from(JSON.stringify({ title: 'Audit', year: '2026', kind: 'movie', expires: Date.now() - 1 })).toString('base64url');
  assert.equal(tokenModule.verifyShort(expired + '.' + crypto.createHmac('sha256', env.SHORTS_SIGNING_SECRET).update(expired).digest('base64url')), null);
  assert.equal(loader({})('lib/short-token.ts').signShort('Audit', '2026', 'movie'), undefined);
});

test('untrusted forwarding headers cannot rotate buckets; local capacity is hard bounded', () => {
  const r = loader({}, undefined, { 'lib/ratelimit.ts': '\nexport function testSize() { return buckets.size; }' })('lib/ratelimit.ts');
  assert.equal(r.clientIp(new Request('http://localhost', { headers: { 'x-forwarded-for': '198.51.100.1', 'x-real-ip': '198.51.100.2' } })), 'unknown');
  for (let i = 0; i < 5100; i++) r.rateLimit('client-' + i, { limit: 2, windowMs: 60000 });
  assert.equal(r.testSize(), 5000);
  assert.equal(r.rateLimit('new-client', { limit: 2, windowMs: 60000 }).ok, false);
  assert.equal(r.rateLimit('client-0', { limit: 2, windowMs: 60000 }).ok, true);
  assert.equal(r.rateLimit('client-0', { limit: 2, windowMs: 60000 }).ok, false);
});

test('live production requests fail closed without a shared store or when it fails', async () => {
  const request = new Request('http://localhost');
  const missing = loader({ NODE_ENV: 'production', TMDB_API_KEY: 'dummy' })('lib/ratelimit.ts');
  assert.equal((await missing.apiRateLimit(request, 'recommend', 15)).unavailable, true);
  const broken = loader({ ...storeEnv, NODE_ENV: 'production' })('lib/ratelimit.ts');
  assert.equal((await broken.apiRateLimit(request, 'shorts', 30)).unavailable, true);
  assert.equal((await loader({ YT_API_KEY: 'dummy' })('lib/youtube.ts').getTopShort('Audit', '2026')).fallback, true);
});

test('atomic shared reservations cannot overdraw their budget across workers', async () => {
  const store = fakeStore();
  const a = loader(storeEnv, store.fetch)('lib/security-store.ts');
  const b = loader(storeEnv, store.fetch)('lib/security-store.ts');
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? a : b).reserveBudget('test', 100, 1000, 60000)));
  assert.equal(results.filter(Boolean).length, 10);
  assert.equal(store.values.get('whatowatch:test'), 1000);
});

test('clip misses are cached and concurrent lookups are deduplicated across workers', async () => {
  const store = fakeStore();
  const a = loader(storeEnv, store.fetch)('lib/youtube.ts');
  const b = loader(storeEnv, store.fetch)('lib/youtube.ts');
  await Promise.all([a.getTopShort('Audit Title', '2026'), a.getTopShort('Audit Title', '2026'), b.getTopShort('Audit Title', '2026')]);
  assert.equal(store.searches(), 3);
  await b.getTopShort('Audit Title', '2026');
  assert.equal(store.searches(), 3);
});

test('unique titles cannot spend more than the shared 8000-unit daily clip budget', async () => {
  const store = fakeStore();
  const y = loader(storeEnv, store.fetch)('lib/youtube.ts');
  for (let i = 0; i < 40; i++) await y.getTopShort('Audit Title ' + i, '2026');
  assert.equal(store.searches(), 80);
  const counters = [...store.values].filter(([key]) => key.includes('youtube:quota:'));
  assert.equal(counters.length, 1);
  assert.equal(counters[0][1], 8000);
});

test('recommendation candidate rejection cannot exceed the request detail budget', async () => {
  let details = 0;
  const mockFetch = async url => {
    if (new URL(url).pathname.includes('/discover/')) return Response.json({ results: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1, title: 'Audit Title ' + i, poster_path: '/dummy.jpg', genre_ids: [35], vote_average: 7, vote_count: 500,
    })) });
    details++;
    return Response.json({ runtime: 160 });
  };
  const t = loader({ TMDB_API_KEY: 'dummy' }, mockFetch)('lib/tmdb.ts');
  await assert.rejects(t.getRecommendations({ format: 'movie', mood: 'laugh', time: 'short', genres: ['35'], language: 'en', providers: [] }));
  assert.equal(details, 12);
});

test('request cancellation prevents upstream work', async () => {
  const controller = new AbortController(); controller.abort();
  const t = loader({ TMDB_API_KEY: 'dummy' })('lib/tmdb.ts');
  await assert.rejects(t.getRecommendations({ format: 'movie', mood: 'chill', time: 'any', genres: [], language: 'en', providers: [] }, 1, controller.signal));
});

test('patched braces handles normal patterns and rejects deeply nested patterns', () => {
  const braces = require('braces');
  assert.deepEqual(braces.expand('file-{a,b}.js'), ['file-a.js', 'file-b.js']);
  assert.throws(() => braces.compile('{'.repeat(1000) + 'a,b' + '}'.repeat(1000)), /safe depth/);
  assert.throws(() => braces.compile('('.repeat(1000) + 'a' + ')'.repeat(1000)), /safe depth/);
});
