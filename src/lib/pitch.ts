/**
 * Pitch detection with the McLeod Pitch Method (NSDF + key-maxima picking).
 *
 * Plain autocorrelation is easy to write and easy to fool: a plucked steel
 * string has harmonics loud enough that the second peak often beats the first,
 * and the tuner reads an octave too high. The NSDF normalises each lag by the
 * energy actually overlapping at that lag, and the "first key maximum above
 * k × the tallest one" rule is what keeps nylon *and* steel on the right octave.
 */

export type PitchReading = {
  /** Hz, refined below sample resolution by parabolic interpolation. */
  readonly frequency: number;
  /** 0–1 periodicity of the window. Below ~0.9 it wasn't really a note. */
  readonly clarity: number;
};

export type PitchDetectorOptions = {
  readonly sampleRate: number;
  /** Number of samples handed to every call. Buffers are sized from this. */
  readonly windowSize: number;
  readonly minFrequency?: number;
  readonly maxFrequency?: number;
  /** Fraction of the tallest NSDF peak a peak must reach to win. */
  readonly peakThreshold?: number;
};

export type PitchDetector = (samples: Float32Array) => PitchReading | null;

/** Root mean square of a window — the caller's "is anyone playing?" gate. */
export function rootMeanSquare(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/**
 * Builds a detector that reuses its scratch buffers, so running it 25×/second
 * doesn't hand the GC a few megabytes a minute.
 */
const TWO_PI = Math.PI * 2;

/** Farther than this from the NSDF estimate and the phase refinement is wrong, not precise. */
const MAX_REFINE_CENTS = 40;
/** Fundamental amplitude, relative to the window's RMS, below which its phase is noise. */
const MIN_FUNDAMENTAL_STRENGTH = 0.1;

export function createPitchDetector({
  sampleRate,
  windowSize,
  minFrequency = 55,
  maxFrequency = 1400,
  peakThreshold = 0.9,
}: PitchDetectorOptions): PitchDetector {
  const maxLag = Math.min(windowSize - 2, Math.ceil(sampleRate / minFrequency));
  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));

  const nsdf = new Float32Array(maxLag + 1);
  const energyPrefix = new Float64Array(windowSize + 1);
  const peakLags = new Int32Array(maxLag + 1);

  // Two halves of the window, Hann-tapered so the neighbouring harmonics don't
  // leak into the fundamental's bin and drag its phase around.
  const segment = windowSize >> 1;
  const taper = new Float64Array(segment);
  for (let i = 0; i < segment; i += 1) {
    taper[i] = 0.5 - 0.5 * Math.cos((TWO_PI * i) / segment);
  }

  /** One DFT bin, evaluated by rotating a phasor instead of calling trig per sample. */
  const analyseBin = (samples: Float32Array, offset: number, omega: number) => {
    const stepCos = Math.cos(omega);
    const stepSin = Math.sin(omega);
    let spinCos = 1;
    let spinSin = 0;
    let real = 0;
    let imaginary = 0;

    for (let i = 0; i < segment; i += 1) {
      const value = samples[offset + i] * taper[i];
      real += value * spinCos;
      imaginary -= value * spinSin;
      const nextCos = spinCos * stepCos - spinSin * stepSin;
      spinSin = spinSin * stepCos + spinCos * stepSin;
      spinCos = nextCos;
    }

    return {
      phase: Math.atan2(imaginary, real),
      // Hann's coherent gain is 0.5 and a real signal splits across ±f.
      amplitude: (4 * Math.hypot(real, imaginary)) / segment,
    };
  };

  /**
   * Sharpen a coarse f0 using how far the fundamental's phase drifts between the
   * two halves of the window. This sidesteps both things that bias correlation
   * on a real string: the note decaying inside the window, and harmonics sitting
   * slightly sharp of exact multiples. Returns null when the fundamental is too
   * faint for its phase to mean anything.
   */
  const refine = (samples: Float32Array, coarse: number, rms: number): number | null => {
    const omega = (TWO_PI * coarse) / sampleRate;
    const first = analyseBin(samples, 0, omega);
    const second = analyseBin(samples, segment, omega);

    if (Math.min(first.amplitude, second.amplitude) < rms * MIN_FUNDAMENTAL_STRENGTH) {
      return null;
    }

    const drift = second.phase - first.phase - omega * segment;
    const wrapped = drift - TWO_PI * Math.round(drift / TWO_PI);
    const refined = coarse + (wrapped * sampleRate) / (TWO_PI * segment);

    if (refined <= 0) return null;
    return Math.abs(1200 * Math.log2(refined / coarse)) > MAX_REFINE_CENTS ? null : refined;
  };

  return (samples) => {
    if (samples.length < windowSize || minLag >= maxLag) return null;

    // Prefix sums of x² turn the NSDF divisor into O(1) per lag.
    for (let i = 0; i < windowSize; i += 1) {
      energyPrefix[i + 1] = energyPrefix[i] + samples[i] * samples[i];
    }
    const totalEnergy = energyPrefix[windowSize];
    if (totalEnergy <= 0) return null;

    for (let lag = 0; lag <= maxLag; lag += 1) {
      const end = windowSize - lag;
      let correlation = 0;
      for (let i = 0; i < end; i += 1) correlation += samples[i] * samples[i + lag];
      const divisor = energyPrefix[end] + totalEnergy - energyPrefix[lag];
      nsdf[lag] = divisor > 0 ? (2 * correlation) / divisor : 0;
    }

    // Walk past the initial lobe, then keep the tallest point of each positive
    // hump — MPM calls these the key maxima.
    let lag = 1;
    while (lag <= maxLag && nsdf[lag] > 0) lag += 1;

    let peakCount = 0;
    while (lag <= maxLag) {
      while (lag <= maxLag && nsdf[lag] <= 0) lag += 1;
      if (lag > maxLag) break;
      let peak = lag;
      while (lag <= maxLag && nsdf[lag] > 0) {
        if (nsdf[lag] > nsdf[peak]) peak = lag;
        lag += 1;
      }
      peakLags[peakCount] = peak;
      peakCount += 1;
    }
    if (peakCount === 0) return null;

    let tallest = 0;
    for (let i = 0; i < peakCount; i += 1) {
      const value = nsdf[peakLags[i]];
      if (value > tallest) tallest = value;
    }

    const cutoff = tallest * peakThreshold;
    let chosen = -1;
    for (let i = 0; i < peakCount; i += 1) {
      if (nsdf[peakLags[i]] >= cutoff) {
        chosen = peakLags[i];
        break;
      }
    }
    if (chosen < 1 || chosen >= maxLag) return null;

    // Fit a parabola through the peak and its neighbours: one lag step is ~6
    // cents down at low E, so interpolating is the difference between a tuner
    // and a rough guess.
    const left = nsdf[chosen - 1];
    const middle = nsdf[chosen];
    const right = nsdf[chosen + 1];
    const curvature = left - 2 * middle + right;
    const shift =
      curvature < 0 ? Math.max(-1, Math.min(1, (0.5 * (left - right)) / curvature)) : 0;

    const refinedLag = chosen + shift;
    if (refinedLag < minLag || refinedLag > maxLag) return null;

    const clarity = Math.max(
      0,
      Math.min(1, (curvature / 2) * shift * shift + ((right - left) / 2) * shift + middle),
    );

    const coarse = sampleRate / refinedLag;
    const rms = Math.sqrt(totalEnergy / windowSize);

    return { frequency: refine(samples, coarse, rms) ?? coarse, clarity };
  };
}
