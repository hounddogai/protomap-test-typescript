import { LegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

/** One step of the legacy double opt in bundle calculation. */
export interface LegacyDoubleOptInBundleFactor {
  describe(): string;
  adjust(item: LegacyDoubleOptInBundle, value: number): number;
}

export class LegacyDoubleOptInBundleAttemptsOffsetAdjuster implements LegacyDoubleOptInBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: LegacyDoubleOptInBundle, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class LocaleLegacyDoubleOptInBundleAdjuster implements LegacyDoubleOptInBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyDoubleOptInBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyDoubleOptInBundleAdjuster implements LegacyDoubleOptInBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyDoubleOptInBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLegacyDoubleOptInBundleAdjuster implements LegacyDoubleOptInBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyDoubleOptInBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy double opt in bundle steps in order and keeps a trace of each. */
export class LegacyDoubleOptInBundleEngine {
  steps: LegacyDoubleOptInBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDoubleOptInBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyDoubleOptInBundle): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LegacyDoubleOptInBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyDoubleOptInBundleEngine(): LegacyDoubleOptInBundleEngine {
  return new LegacyDoubleOptInBundleEngine(
    [
      new LegacyDoubleOptInBundleAttemptsOffsetAdjuster(0.97),
      new LocaleLegacyDoubleOptInBundleAdjuster(new Map<string, number>([["north", 1.36], ["south", 1.34]])),
      new MinimumLegacyDoubleOptInBundleAdjuster(19.3),
      new CapLegacyDoubleOptInBundleAdjuster(10603),
    ],
    [],
    3,
    96525.5,
  );
}
