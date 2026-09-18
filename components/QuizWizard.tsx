"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Clock,
  Coffee,
  Drop,
  FilmStrip,
  GlobeHemisphereWest,
  Lightning,
  Play,
  Smiley,
  TelevisionSimple,
  Shuffle,
} from "@phosphor-icons/react";
import { GENRE_MAP, PROVIDER_MAP, quizToSearchParams } from "@/lib/quiz";

const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

const GENRE_ICONS = [Lightning, Smiley, Drop, Brain, FilmStrip, Play] as const;

const STEPS = [
  { id: "format", title: "WHAT ARE WE HUNTING TONIGHT?", sub: "One choice. No wrong answers." },
  { id: "mood", title: "HOW ARE YOU FEELING?", sub: "Be honest. We will match the energy." },
  { id: "time", title: "HOW MUCH TIME DO YOU HAVE?", sub: "We will respect the clock." },
  { id: "genres", title: "PICK UP TO 3 VIBES", sub: "Mix freely — hybrids welcome." },
  { id: "language", title: "WHICH LANGUAGE?", sub: "Dubbed counts. No judgment." },
  { id: "providers", title: "WHAT DO YOU PAY FOR?", sub: "We only suggest what you can actually play." },
] as const;

const FORMATS = [
  { id: "movie", l: "Movie", s: "One tight story tonight", icon: FilmStrip },
  { id: "tv", l: "Series", s: "Settle in for episodes", icon: TelevisionSimple },
  { id: "either", l: "Either", s: "Surprise me", icon: Shuffle },
] as const;

const MOODS = [
  { id: "laugh", l: "Make me laugh", s: "Comedy, feel-good chaos", icon: Smiley },
  { id: "thrill", l: "Get my heart racing", s: "Action, crime, horror", icon: Lightning },
  { id: "cry", l: "Make me feel things", s: "Drama, romance", icon: Drop },
  { id: "mindbend", l: "Bend my brain", s: "Sci-fi, mystery", icon: Brain },
  { id: "chill", l: "Help me switch off", s: "Easy, cozy, familiar", icon: Coffee },
] as const;

const TIMES = [
  { id: "short", l: "Under 90 minutes", s: "Quick and punchy", icon: Clock },
  { id: "standard", l: "Around 2 hours", s: "Classic movie night", icon: FilmStrip },
  { id: "binge", l: "Binge a series", s: "Cancel tomorrow's plans", icon: TelevisionSimple },
  { id: "any", l: "No limit", s: "Whatever hits hardest", icon: Armchair },
] as const;

const LANGS = [
  { id: "hi", l: "Hindi", s: "Bollywood & beyond" },
  { id: "en", l: "English", s: "Hollywood & beyond" },
  { id: "either", l: "Either", s: "Good stories, any tongue" },
] as const;

const GENRES = Object.entries(GENRE_MAP).slice(0, 12);
const PROVIDERS = Object.entries(PROVIDER_MAP);

export default function QuizWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [format, setFormat] = useState<"movie" | "tv" | "either">("either");
  const [mood, setMood] = useState("chill");
  const [time, setTime] = useState("any");
  const [genres, setGenres] = useState<string[]>([]);
  const [language, setLanguage] = useState<"hi" | "en" | "either">("either");
  const [providers, setProviders] = useState<string[]>(["8", "9"]);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);
  const meta = STEPS[step];

  function go(n: number) {
    setDir(n > step ? 1 : -1);
    setStep(n);
  }
  function next() {
    if (step < STEPS.length - 1) go(step + 1);
    else {
      const qs = quizToSearchParams({
        format,
        mood: mood as never,
        time: time as never,
        genres,
        language,
        providers,
      });
      router.push(`/results?${qs.toString()}`);
    }
  }
  function toggleGenre(id: string) {
    setGenres((g) =>
      g.includes(id) ? g.filter((x) => x !== id) : g.length >= 3 ? [...g.slice(1), id] : [...g, id],
    );
  }

  const optionCls = (active: boolean) =>
    `group flex w-full items-center gap-4 rounded-[6px] border-2 p-4 sm:p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 card-hover active:scale-[0.98] ${
      active
        ? "border-black bg-[#f4ed36] text-black"
        : "border-black bg-[#f9f5f2] text-[#1a1a1a] hover:bg-[#f9cc73]"
    }`;

  const iconBox = (active: boolean) =>
    `grid place-items-center w-11 h-11 rounded-[6px] border-2 border-black shrink-0 transition-colors ${
      active ? "bg-black text-[#f4ed36]" : "bg-white text-black"
    }`;

  return (
    <main className="bg-[#8584bd] w-full">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12 w-full">
        <div className="lilac-block border-2 border-black">
          <div className="flex items-center justify-between">
            <span className="mono-tag flex items-center gap-2 text-[#f9f5f2]">
              <GlobeHemisphereWest size={16} weight="duotone" className="text-[#f4ed36]" />
              Step {step + 1} of {STEPS.length} ★ {meta.id}
            </span>
            <span className="mono-tag text-[#f4ed36]">{Math.round(progress)}%</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-[#1a1a1a] overflow-hidden border border-black">
            <motion.div
              className="h-full bg-[#f4ed36]"
              animate={{ width: `${progress}%` }}
              transition={SPRING}
            />
          </div>
        </div>

        <div className="dark-text-card mt-6">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.section
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: 48 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 * dir }}
              transition={{ duration: 0.35, ease: [...EASE] }}
            >
              <p className="mono-tag inline-block bg-[#c94245] text-[#f9f5f2] rounded-full px-3 py-1.5 border border-black">
                ★ Question {step + 1}
              </p>
              <h2 className="font-poster mt-4 text-4xl md:text-6xl leading-[0.95] text-[#1a1a1a]">
                {meta.title}
              </h2>
              <p className="mono-micro mt-2 text-[#1a1a1a]/80">{meta.sub}</p>

              <motion.div
                className="mt-6 grid gap-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              >
                {step === 0 &&
                  FORMATS.map((o) => (
                    <motion.button
                      key={o.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      className={optionCls(format === o.id)}
                      onClick={() => setFormat(o.id)}
                    >
                      <span className={iconBox(format === o.id)}>
                        <o.icon size={22} weight="duotone" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold-body text-lg">{o.l}</span>
                        <span className="block text-sm opacity-70">{o.s}</span>
                      </span>
                      {format === o.id && <Check size={20} weight="bold" />}
                    </motion.button>
                  ))}

                {step === 1 &&
                  MOODS.map((m) => (
                    <motion.button
                      key={m.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      className={optionCls(mood === m.id)}
                      onClick={() => setMood(m.id)}
                    >
                      <span className={iconBox(mood === m.id)}>
                        <m.icon size={22} weight="duotone" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold-body text-lg">{m.l}</span>
                        <span className="block text-sm opacity-70">{m.s}</span>
                      </span>
                      {mood === m.id && <Check size={20} weight="bold" />}
                    </motion.button>
                  ))}

                {step === 2 &&
                  TIMES.map((o) => (
                    <motion.button
                      key={o.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      className={optionCls(time === o.id)}
                      onClick={() => setTime(o.id)}
                    >
                      <span className={iconBox(time === o.id)}>
                        <o.icon size={22} weight="duotone" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold-body text-lg">{o.l}</span>
                        <span className="block text-sm opacity-70">{o.s}</span>
                      </span>
                      {time === o.id && <Check size={20} weight="bold" />}
                    </motion.button>
                  ))}

                {step === 3 && (
                  <div className="grid grid-cols-2 gap-3">
                    {GENRES.map(([id, name], gi) => {
                      const Icon = GENRE_ICONS[gi % GENRE_ICONS.length];
                      const on = genres.includes(id);
                      return (
                        <motion.button
                          key={id}
                          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                          className={`${optionCls(on)} !gap-3`}
                          onClick={() => toggleGenre(id)}
                        >
                          <span className={`grid place-items-center w-9 h-9 rounded-[6px] border-2 border-black shrink-0 ${on ? "bg-black text-[#f4ed36]" : "bg-white text-black"}`}>
                            <Icon size={19} weight="duotone" />
                          </span>
                          <span className="font-bold-body text-sm">{name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {step === 4 &&
                  LANGS.map((o) => (
                    <motion.button
                      key={o.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      className={optionCls(language === o.id)}
                      onClick={() => setLanguage(o.id as never)}
                    >
                      <span className="flex-1">
                        <span className="block font-bold-body text-lg">{o.l}</span>
                        <span className="block text-sm opacity-70">{o.s}</span>
                      </span>
                      {language === o.id && <Check size={20} weight="bold" />}
                    </motion.button>
                  ))}

                {step === 5 && (
                  <div className="grid grid-cols-2 gap-3">
                    {PROVIDERS.map(([id, name]) => {
                      const on = providers.includes(id);
                      return (
                        <motion.button
                          key={id}
                          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                          className={optionCls(on)}
                          onClick={() =>
                            setProviders((p) =>
                              p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
                            )
                          }
                        >
                          <span className="flex-1 font-bold-body text-sm">{name}</span>
                          <span
                            className={`grid place-items-center w-6 h-6 rounded-full border-2 border-black ${
                              on ? "bg-black text-[#f4ed36]" : "bg-white text-transparent"
                            }`}
                          >
                            <Check size={14} weight="bold" />
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </motion.section>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            <button
              disabled={step === 0}
              onClick={() => go(Math.max(0, step - 1))}
              className="btn-outline !text-[#1a1a1a] !border-[#1a1a1a] disabled:opacity-40"
            >
              <ArrowLeft size={17} weight="bold" /> Back
            </button>
            <motion.button
              onClick={next}
              whileTap={{ scale: 0.98 }}
              className="btn-gate flex-1 justify-center"
            >
              {step === STEPS.length - 1 ? (
                <>Show my 5 picks <ArrowRight size={18} weight="bold" /></>
              ) : (
                <>Continue <ArrowRight size={18} weight="bold" /></>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}
