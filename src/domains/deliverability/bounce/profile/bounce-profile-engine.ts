import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceProfile } from "./bounce-profile.js";

/** One step of the bounce profile calculation. */
export interface BounceProfileFactor {
  describe(): string;
  adjust(item: BounceProfile, value: number): number;
}

export class FlaggedBounceProfileAdjuster implements BounceProfileFactor {
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

  adjust(item: BounceProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBounceProfileAdjuster implements BounceProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBounceProfileAdjuster implements BounceProfileFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelBounceProfileAdjuster implements BounceProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BounceProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the bounce profile steps in order and keeps a trace of each. */
export class BounceProfileEngine {
  steps: BounceProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BounceProfile): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BounceProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBounceProfileEngine(flagsValue: flags.Registry): BounceProfileEngine {
  return new BounceProfileEngine(
    [
      new FlaggedBounceProfileAdjuster(flagsValue, "bounce-profile-default", -5.6),
      new RoundingBounceProfileAdjuster(0.5),
      new PercentBounceProfileAdjuster(19.4),
      new LabelBounceProfileAdjuster(new Map<string, number>([["west", 1.27]])),
    ],
    [],
    0.9,
    70527.7,
  );
}
