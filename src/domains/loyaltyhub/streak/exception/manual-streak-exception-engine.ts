import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualStreakException } from "./manual-streak-exception.js";

/** One step of the manual streak exception calculation. */
export interface ManualStreakExceptionAdjuster {
  describe(): string;
  adjust(item: ManualStreakException, value: number): number;
}

export class PercentManualStreakExceptionAdjuster implements ManualStreakExceptionAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualStreakException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedManualStreakExceptionAdjuster implements ManualStreakExceptionAdjuster {
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

  adjust(item: ManualStreakException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualStreakExceptionAdjuster implements ManualStreakExceptionAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualStreakException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual streak exception steps in order and keeps a trace of each. */
export class ManualStreakExceptionEngine {
  steps: ManualStreakExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualStreakExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualStreakException): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ManualStreakException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualStreakExceptionEngine(flagsValue: flags.Registry): ManualStreakExceptionEngine {
  return new ManualStreakExceptionEngine(
    [
      new PercentManualStreakExceptionAdjuster(19.1),
      new FlaggedManualStreakExceptionAdjuster(flagsValue, "manual-streak-exception-default", -3.2),
      new MinimumManualStreakExceptionAdjuster(38.3),
    ],
    [],
    4.2,
    25044.1,
  );
}
