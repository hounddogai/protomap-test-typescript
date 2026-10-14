import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualChallengeTier } from "./manual-challenge-tier.js";

/** One step of the manual challenge tier calculation. */
export interface ManualChallengeTierModifier {
  describe(): string;
  adjust(item: ManualChallengeTier, value: number): number;
}

export class CapManualChallengeTierAdjuster implements ManualChallengeTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualChallengeTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualChallengeTierAdjuster implements ManualChallengeTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualChallengeTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualChallengeTierAdjuster implements ManualChallengeTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualChallengeTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualChallengeTierAdjuster implements ManualChallengeTierModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ManualChallengeTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualChallengeTierAdjuster implements ManualChallengeTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualChallengeTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualChallengeTierAdjuster implements ManualChallengeTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualChallengeTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual challenge tier steps in order and keeps a trace of each. */
export class ManualChallengeTierEngine {
  steps: ManualChallengeTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualChallengeTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualChallengeTier): number {
    let current = item.effectiveValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ManualChallengeTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualChallengeTierEngine(flagsValue: flags.Registry): ManualChallengeTierEngine {
  return new ManualChallengeTierEngine(
    [
      new CapManualChallengeTierAdjuster(18232),
      new PercentManualChallengeTierAdjuster(6.8),
      new RoundingManualChallengeTierAdjuster(0.25),
      new FlaggedManualChallengeTierAdjuster(flagsValue, "manual-challenge-tier-batched", -1.7),
      new MinimumManualChallengeTierAdjuster(32.8),
      new TieredManualChallengeTierAdjuster([2986, 4038], [1.17, 0.98]),
    ],
    [],
    1.7,
    85847.9,
  );
}
