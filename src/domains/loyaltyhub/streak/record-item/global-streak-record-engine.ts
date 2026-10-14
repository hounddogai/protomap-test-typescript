import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalStreakRecord } from "./global-streak-record.js";

/** One step of the global streak record calculation. */
export interface GlobalStreakRecordModifier {
  describe(): string;
  adjust(item: GlobalStreakRecord, value: number): number;
}

export class MinimumGlobalStreakRecordAdjuster implements GlobalStreakRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalStreakRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalStreakRecordAdjuster implements GlobalStreakRecordModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalStreakRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentGlobalStreakRecordAdjuster implements GlobalStreakRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalStreakRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalStreakRecordAdjuster implements GlobalStreakRecordModifier {
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

  adjust(item: GlobalStreakRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitGlobalStreakRecordAdjuster implements GlobalStreakRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: GlobalStreakRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global streak record steps in order and keeps a trace of each. */
export class GlobalStreakRecordEngine {
  steps: GlobalStreakRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalStreakRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalStreakRecord): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: GlobalStreakRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalStreakRecordEngine(flagsValue: flags.Registry): GlobalStreakRecordEngine {
  return new GlobalStreakRecordEngine(
    [
      new MinimumGlobalStreakRecordAdjuster(30.8),
      new RoundingGlobalStreakRecordAdjuster(0.1),
      new PercentGlobalStreakRecordAdjuster(-1.3),
      new FlaggedGlobalStreakRecordAdjuster(flagsValue, "global-streak-record-seasonal", -3),
      new UnitGlobalStreakRecordAdjuster(new Map<string, number>([["east", 1.37]])),
    ],
    [],
    3.3,
    41004.3,
  );
}
