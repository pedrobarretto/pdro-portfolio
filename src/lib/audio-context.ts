/** `AudioContext` including the prefixed name older Safari still ships. */
export function audioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const legacy = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? legacy.webkitAudioContext;
}
