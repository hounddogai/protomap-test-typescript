import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

/** One step of the primary cohort adjustment calculation. */
export interface PrimaryCohortAdjustmentFactor {
  describe(): string;
  adjust(item: PrimaryCohortAdjustment, value: number): number;
}

export class FlaggedPrimaryCohortAdjustmentAdjuster implements PrimaryCohortAdjustmentFactor {
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

  adjust(item: PrimaryCohortAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryCohortAdjustmentAdjuster implements PrimaryCohortAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryCohortAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PrimaryCohortAdjustmentWindowDaysOffsetAdjuster implements PrimaryCohortAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: PrimaryCohortAdjustment, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class MinimumPrimaryCohortAdjustmentAdjuster implements PrimaryCohortAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryCohortAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary cohort adjustment steps in order and keeps a trace of each. */
export class PrimaryCohortAdjustmentEngine {
  steps: PrimaryCohortAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryCohortAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryCohortAdjustment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimaryCohortAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryCohortAdjustmentEngine(flagsValue: flags.Registry): PrimaryCohortAdjustmentEngine {
  return new PrimaryCohortAdjustmentEngine(
    [
      new FlaggedPrimaryCohortAdjustmentAdjuster(flagsValue, "primary-cohort-adjustment-rolling", -4.7),
      new RoundingPrimaryCohortAdjustmentAdjuster(0.25),
      new PrimaryCohortAdjustmentWindowDaysOffsetAdjuster(1.45),
      new MinimumPrimaryCohortAdjustmentAdjuster(3.5),
    ],
    [],
    3.5,
    81720.3,
  );
}
