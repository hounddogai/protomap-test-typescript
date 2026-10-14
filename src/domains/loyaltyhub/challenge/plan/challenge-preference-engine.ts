import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengePreference } from "./challenge-preference.js";

/** One step of the challenge preference calculation. */
export interface ChallengePreferenceStep {
  describe(): string;
  adjust(item: ChallengePreference, value: number): number;
}

export class RoundingChallengePreferenceAdjuster implements ChallengePreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapChallengePreferenceAdjuster implements ChallengePreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleChallengePreferenceAdjuster implements ChallengePreferenceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ChallengePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumChallengePreferenceAdjuster implements ChallengePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedChallengePreferenceAdjuster implements ChallengePreferenceStep {
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

  adjust(item: ChallengePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredChallengePreferenceAdjuster implements ChallengePreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the challenge preference steps in order and keeps a trace of each. */
export class ChallengePreferenceEngine {
  steps: ChallengePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengePreference): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ChallengePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengePreferenceEngine(flagsValue: flags.Registry): ChallengePreferenceEngine {
  return new ChallengePreferenceEngine(
    [
      new RoundingChallengePreferenceAdjuster(0.1),
      new CapChallengePreferenceAdjuster(4176),
      new LocaleChallengePreferenceAdjuster(new Map<string, number>([["central", 0.81], ["south", 0.99]])),
      new MinimumChallengePreferenceAdjuster(48.5),
      new FlaggedChallengePreferenceAdjuster(flagsValue, "challenge-preference-weighted", 5.1),
      new TieredChallengePreferenceAdjuster([6443, 7802, 9141], [0.94, 0.86, 1.1]),
    ],
    [],
    0.8,
    34872.5,
  );
}
