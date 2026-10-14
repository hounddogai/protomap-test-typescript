import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakAdjustment } from "./streak-adjustment.js";

/** One step of the streak adjustment calculation. */
export interface StreakAdjustmentFactor {
  describe(): string;
  adjust(item: StreakAdjustment, value: number): number;
}

export class FlaggedStreakAdjustmentAdjuster implements StreakAdjustmentFactor {
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

  adjust(item: StreakAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStreakAdjustmentAdjuster implements StreakAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleStreakAdjustmentAdjuster implements StreakAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StreakAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak adjustment steps in order and keeps a trace of each. */
export class StreakAdjustmentEngine {
  steps: StreakAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakAdjustment): number {
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

  evaluateAll(items: StreakAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakAdjustmentEngine(flagsValue: flags.Registry): StreakAdjustmentEngine {
  return new StreakAdjustmentEngine(
    [
      new FlaggedStreakAdjustmentAdjuster(flagsValue, "streak-adjustment-strict", -3.3),
      new MinimumStreakAdjustmentAdjuster(34.4),
      new LocaleStreakAdjustmentAdjuster(new Map<string, number>([["online", 0.89], ["south", 1.39]])),
    ],
    [],
    0.5,
    22261.5,
  );
}
