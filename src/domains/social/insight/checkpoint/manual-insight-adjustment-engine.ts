import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualInsightAdjustment } from "./manual-insight-adjustment.js";

/** One step of the manual insight adjustment calculation. */
export interface ManualInsightAdjustmentAdjuster {
  describe(): string;
  adjust(item: ManualInsightAdjustment, value: number): number;
}

export class ManualInsightAdjustmentCapacityOffsetAdjuster implements ManualInsightAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ManualInsightAdjustment, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class MinimumManualInsightAdjustmentAdjuster implements ManualInsightAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualInsightAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualInsightAdjustmentAdjuster implements ManualInsightAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualInsightAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualInsightAdjustmentAdjuster implements ManualInsightAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualInsightAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualInsightAdjustmentAdjuster implements ManualInsightAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualInsightAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualInsightAdjustmentAdjuster implements ManualInsightAdjustmentAdjuster {
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

  adjust(item: ManualInsightAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual insight adjustment steps in order and keeps a trace of each. */
export class ManualInsightAdjustmentEngine {
  steps: ManualInsightAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualInsightAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualInsightAdjustment): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ManualInsightAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualInsightAdjustmentEngine(flagsValue: flags.Registry): ManualInsightAdjustmentEngine {
  return new ManualInsightAdjustmentEngine(
    [
      new ManualInsightAdjustmentCapacityOffsetAdjuster(0.64),
      new MinimumManualInsightAdjustmentAdjuster(39.4),
      new PercentManualInsightAdjustmentAdjuster(-21.4),
      new CapManualInsightAdjustmentAdjuster(7794),
      new RoundingManualInsightAdjustmentAdjuster(0.1),
      new FlaggedManualInsightAdjustmentAdjuster(flagsValue, "manual-insight-adjustment-adaptive", -6.8),
    ],
    [],
    1.5,
    10531.7,
  );
}
