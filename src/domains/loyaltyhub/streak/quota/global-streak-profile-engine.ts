import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalStreakProfile } from "./global-streak-profile.js";

/** One step of the global streak profile calculation. */
export interface GlobalStreakProfileModifier {
  describe(): string;
  adjust(item: GlobalStreakProfile, value: number): number;
}

export class MinimumGlobalStreakProfileAdjuster implements GlobalStreakProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalStreakProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalStreakProfileAdjuster implements GlobalStreakProfileModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalStreakProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedGlobalStreakProfileAdjuster implements GlobalStreakProfileModifier {
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

  adjust(item: GlobalStreakProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global streak profile steps in order and keeps a trace of each. */
export class GlobalStreakProfileEngine {
  steps: GlobalStreakProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalStreakProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalStreakProfile): number {
    let current = item.netValue();
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

  evaluateAll(items: GlobalStreakProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalStreakProfileEngine(flagsValue: flags.Registry): GlobalStreakProfileEngine {
  return new GlobalStreakProfileEngine(
    [
      new MinimumGlobalStreakProfileAdjuster(12.8),
      new RoundingGlobalStreakProfileAdjuster(0.05),
      new FlaggedGlobalStreakProfileAdjuster(flagsValue, "global-streak-profile-adaptive", -4.9),
    ],
    [],
    1.3,
    29379.8,
  );
}
