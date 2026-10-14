import * as flags from "../../../../kit/flags.js";
import { RetentionAdjustment } from "./retention-adjustment.js";

/** One step of the retention adjustment calculation. */
export interface RetentionAdjustmentAdjuster {
  describe(): string;
  adjust(item: RetentionAdjustment, value: number): number;
}

export class TitleRetentionAdjustmentAdjuster implements RetentionAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RetentionAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRetentionAdjustmentAdjuster implements RetentionAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRetentionAdjustmentAdjuster implements RetentionAdjustmentAdjuster {
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

  adjust(item: RetentionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRetentionAdjustmentAdjuster implements RetentionAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRetentionAdjustmentAdjuster implements RetentionAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RetentionAdjustmentStartsAtOffsetAdjuster implements RetentionAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: RetentionAdjustment, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

/** Runs the retention adjustment steps in order and keeps a trace of each. */
export class RetentionAdjustmentEngine {
  steps: RetentionAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RetentionAdjustment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RetentionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRetentionAdjustmentEngine(flagsValue: flags.Registry): RetentionAdjustmentEngine {
  return new RetentionAdjustmentEngine(
    [
      new TitleRetentionAdjustmentAdjuster(new Map<string, number>([["east", 0.9], ["central", 0.73]])),
      new PercentRetentionAdjustmentAdjuster(-20.5),
      new FlaggedRetentionAdjustmentAdjuster(flagsValue, "retention-adjustment-adaptive", 9.1),
      new MinimumRetentionAdjustmentAdjuster(16.7),
      new TieredRetentionAdjustmentAdjuster([460, 4094, 8395], [1.17, 1.07, 1.08]),
      new RetentionAdjustmentStartsAtOffsetAdjuster(1.98),
    ],
    [],
    0.5,
    44623.3,
  );
}
