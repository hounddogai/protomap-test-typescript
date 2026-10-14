import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardProfile } from "./lenient-reward-profile.js";

/** One step of the lenient reward profile calculation. */
export interface LenientRewardProfileModifier {
  describe(): string;
  adjust(item: LenientRewardProfile, value: number): number;
}

export class FlaggedLenientRewardProfileAdjuster implements LenientRewardProfileModifier {
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

  adjust(item: LenientRewardProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientRewardProfileAdjuster implements LenientRewardProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientRewardProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientRewardProfileAdjuster implements LenientRewardProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientRewardProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient reward profile steps in order and keeps a trace of each. */
export class LenientRewardProfileEngine {
  steps: LenientRewardProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientRewardProfile): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LenientRewardProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientRewardProfileEngine(flagsValue: flags.Registry): LenientRewardProfileEngine {
  return new LenientRewardProfileEngine(
    [
      new FlaggedLenientRewardProfileAdjuster(flagsValue, "lenient-reward-profile-weighted", 2.7),
      new PercentLenientRewardProfileAdjuster(-13.1),
      new MinimumLenientRewardProfileAdjuster(14.6),
    ],
    [],
    3.5,
    44279.2,
  );
}
