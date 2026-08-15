"use client";

import { Music } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";

const TUNER_HREF = "/tuner?intro=1";
/** Long enough for the cover to reach full opacity before the route swaps. */
const COVER_MS = 420;

/**
 * The quiet note next to the clock. Clicking it washes the page out to the plain
 * background colour, and the tuner page picks the same colour up on the other
 * side — so the joke that plays over there feels like one continuous move.
 */
export function MusicNoteEasterEgg() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch(TUNER_HREF);
  }, [router]);

  const handleClick = () => {
    if (leaving) return;
    haptic([10, 30, 14], true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(TUNER_HREF);
      return;
    }

    setLeaving(true);
    window.setTimeout(() => router.push(TUNER_HREF), COVER_MS);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Guitar tuner"
        className="text-muted-foreground/60 transition-[color,transform] duration-200 hover:text-foreground hover:-translate-y-0.5 hover:-rotate-6 active:scale-90 cursor-pointer"
      >
        <Music className="size-4" strokeWidth={1.75} aria-hidden />
      </button>

      {leaving && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-egg-cover"
          aria-hidden
        >
          <Music
            className="size-8 text-muted-foreground animate-egg-note"
            strokeWidth={1.5}
          />
        </div>
      )}
    </>
  );
}
