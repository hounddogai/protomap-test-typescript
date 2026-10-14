import * as flags from "../../../../kit/flags.js";
import { WeightedActivationBatch } from "./weighted-activation-batch.js";

/** One step of the weighted activation batch calculation. */
export interface WeightedActivationBatchModifier {
  describe(): string;
  adjust(item: WeightedActivationBatch, value: number): number;
}

export class WeightedActivationBatchMinimumOffsetAdjuster implements WeightedActivationBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: WeightedActivationBatch, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class PercentWeightedActivationBatchAdjuster implements WeightedActivationBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedActivationBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentWeightedActivationBatchAdjuster implements WeightedActivationBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: WeightedActivationBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedActivationBatchAdjuster implements WeightedActivationBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedActivationBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedActivationBatchAdjuster implements WeightedActivationBatchModifier {
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

  adjust(item: WeightedActivationBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted activation batch steps in order and keeps a trace of each. */
export class WeightedActivationBatchEngine {
  steps: WeightedActivationBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedActivationBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedActivationBatch): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WeightedActivationBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedActivationBatchEngine(flagsValue: flags.Registry): WeightedActivationBatchEngine {
  return new WeightedActivationBatchEngine(
    [
      new WeightedActivationBatchMinimumOffsetAdjuster(0.98),
      new PercentWeightedActivationBatchAdjuster(4.1),
      new SegmentWeightedActivationBatchAdjuster(new Map<string, number>([["online", 1.15]])),
      new CapWeightedActivationBatchAdjuster(22215),
      new FlaggedWeightedActivationBatchAdjuster(flagsValue, "weighted-activation-batch-primary", -3.9),
    ],
    [],
    1.9,
    70925.1,
  );
}
