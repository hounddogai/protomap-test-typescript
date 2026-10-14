import { PreferenceBundle } from "./preference-bundle.js";

/** One step of the preference bundle calculation. */
export interface PreferenceBundleModifier {
  describe(): string;
  adjust(item: PreferenceBundle, value: number): number;
}

export class PercentPreferenceBundleAdjuster implements PreferenceBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPreferenceBundleAdjuster implements PreferenceBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPreferenceBundleAdjuster implements PreferenceBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PreferenceBundleThresholdOffsetAdjuster implements PreferenceBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PreferenceBundle, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapPreferenceBundleAdjuster implements PreferenceBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the preference bundle steps in order and keeps a trace of each. */
export class PreferenceBundleEngine {
  steps: PreferenceBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferenceBundle): number {
    let current = item.weightedExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: PreferenceBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferenceBundleEngine(): PreferenceBundleEngine {
  return new PreferenceBundleEngine(
    [
      new PercentPreferenceBundleAdjuster(19.7),
      new MinimumPreferenceBundleAdjuster(27.2),
      new TieredPreferenceBundleAdjuster([309, 2706, 3011], [1.08, 0.93, 0.97]),
      new PreferenceBundleThresholdOffsetAdjuster(0.71),
      new CapPreferenceBundleAdjuster(32646),
    ],
    [],
    1.4,
    4334.3,
  );
}
