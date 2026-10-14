import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPathAdjustment } from "./default-path-adjustment.js";

/** One step of the default path adjustment calculation. */
export interface DefaultPathAdjustmentStep {
  describe(): string;
  adjust(item: DefaultPathAdjustment, value: number): number;
}

export class PercentDefaultPathAdjustmentAdjuster implements DefaultPathAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPathAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DefaultPathAdjustmentStartsAtOffsetAdjuster implements DefaultPathAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: DefaultPathAdjustment, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class FlaggedDefaultPathAdjustmentAdjuster implements DefaultPathAdjustmentStep {
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

  adjust(item: DefaultPathAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultPathAdjustmentAdjuster implements DefaultPathAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPathAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default path adjustment steps in order and keeps a trace of each. */
export class DefaultPathAdjustmentEngine {
  steps: DefaultPathAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPathAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultPathAdjustment): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DefaultPathAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultPathAdjustmentEngine(flagsValue: flags.Registry): DefaultPathAdjustmentEngine {
  return new DefaultPathAdjustmentEngine(
    [
      new PercentDefaultPathAdjustmentAdjuster(14.5),
      new DefaultPathAdjustmentStartsAtOffsetAdjuster(0.2),
      new FlaggedDefaultPathAdjustmentAdjuster(flagsValue, "default-path-adjustment-seasonal", 7.6),
      new RoundingDefaultPathAdjustmentAdjuster(0.05),
    ],
    [],
    3.7,
    57800.3,
  );
}
