import * as flags from "../../../../kit/flags.js";
import { DefaultNudgeException } from "./default-nudge-exception.js";

/** One step of the default nudge exception calculation. */
export interface DefaultNudgeExceptionFactor {
  describe(): string;
  adjust(item: DefaultNudgeException, value: number): number;
}

export class PercentDefaultNudgeExceptionAdjuster implements DefaultNudgeExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultNudgeException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DefaultNudgeExceptionDiscountOffsetAdjuster implements DefaultNudgeExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: DefaultNudgeException, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedDefaultNudgeExceptionAdjuster implements DefaultNudgeExceptionFactor {
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

  adjust(item: DefaultNudgeException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultNudgeExceptionAdjuster implements DefaultNudgeExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultNudgeException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default nudge exception steps in order and keeps a trace of each. */
export class DefaultNudgeExceptionEngine {
  steps: DefaultNudgeExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultNudgeExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultNudgeException): number {
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

  evaluateAll(items: DefaultNudgeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultNudgeExceptionEngine(flagsValue: flags.Registry): DefaultNudgeExceptionEngine {
  return new DefaultNudgeExceptionEngine(
    [
      new PercentDefaultNudgeExceptionAdjuster(-2.5),
      new DefaultNudgeExceptionDiscountOffsetAdjuster(0.08),
      new FlaggedDefaultNudgeExceptionAdjuster(flagsValue, "default-nudge-exception-seasonal", -8.3),
      new MinimumDefaultNudgeExceptionAdjuster(32.8),
    ],
    [],
    0.7,
    36168.5,
  );
}
