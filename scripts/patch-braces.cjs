// GHSA-vfj7-8cjw-p6xm has no published patched braces release yet.
// Bound parser AST depth before its recursive compile/expand/stringify passes.
const fs = require('node:fs');
let file;
try { file = require.resolve('braces/lib/parse'); }
catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  // Production installations may deliberately omit all development tooling.
  process.exit(0);
}
const version = require('braces/package.json').version;
if (version !== '3.0.3') throw new Error('Re-review the braces security patch for the installed version');
const source = fs.readFileSync(file, 'utf8');
const marker = "      if (stack.length >= 64) throw new SyntaxError('Brace nesting exceeds safe depth');";
if (!source.includes(marker)) {
  const target = '      stack.push(block);';
  if (source.split(target).length !== 3) throw new Error('Unexpected braces parser; security patch was not applied');
  fs.writeFileSync(file, source.replaceAll(target, marker + '\n' + target));
}
