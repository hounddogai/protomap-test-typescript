import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationPreference } from "./reputation-preference.js";

/** One step of the reputation preference calculation. */
export interface ReputationPreferenceStep {
  describe(): string;
  adjust(item: ReputationPreference, value: number): number;
}

export class MinimumReputationPreferenceAdjuster implements ReputationPreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapReputationPreferenceAdjuster implements ReputationPreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingReputationPreferenceAdjuster implements ReputationPreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredReputationPreferenceAdjuster implements ReputationPreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedReputationPreferenceAdjuster implements ReputationPreferenceStep {
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

  adjust(item: ReputationPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameReputationPreferenceAdjuster implements ReputationPreferenceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ReputationPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reputation preference steps in order and keeps a trace of each. */
export class ReputationPreferenceEngine {
  steps: ReputationPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationPreference): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ReputationPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationPreferenceEngine(flagsValue: flags.Registry): ReputationPreferenceEngine {
  return new ReputationPreferenceEngine(
    [
      new MinimumReputationPreferenceAdjuster(23.7),
      new CapReputationPreferenceAdjuster(8577),
      new RoundingReputationPreferenceAdjuster(1),
      new TieredReputationPreferenceAdjuster([2410, 3088, 3684], [1.02, 0.82, 0.95]),
      new FlaggedReputationPreferenceAdjuster(flagsValue, "reputation-preference-weighted", 7),
      new NameReputationPreferenceAdjuster(new Map<string, number>([["retail", 1.34], ["south", 1.13]])),
    ],
    [],
    2.8,
    36789.2,
  );
}
