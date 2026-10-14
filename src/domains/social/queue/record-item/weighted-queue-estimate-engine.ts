import * as flags from "../../../../kit/flags.js";
import { WeightedQueueEstimate } from "./weighted-queue-estimate.js";

/** One step of the weighted queue estimate calculation. */
export interface WeightedQueueEstimateAdjuster {
  describe(): string;
  adjust(item: WeightedQueueEstimate, value: number): number;
}

export class WeightedQueueEstimateMaximumOffsetAdjuster implements WeightedQueueEstimateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: WeightedQueueEstimate, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class TieredWeightedQueueEstimateAdjuster implements WeightedQueueEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedQueueEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWeightedQueueEstimateAdjuster implements WeightedQueueEstimateAdjuster {
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

  adjust(item: WeightedQueueEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelWeightedQueueEstimateAdjuster implements WeightedQueueEstimateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedQueueEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedQueueEstimateAdjuster implements WeightedQueueEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedQueueEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWeightedQueueEstimateAdjuster implements WeightedQueueEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedQueueEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted queue estimate steps in order and keeps a trace of each. */
export class WeightedQueueEstimateEngine {
  steps: WeightedQueueEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedQueueEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedQueueEstimate): number {
    let current = item.netTotal();
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

  evaluateAll(items: WeightedQueueEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedQueueEstimateEngine(flagsValue: flags.Registry): WeightedQueueEstimateEngine {
  return new WeightedQueueEstimateEngine(
    [
      new WeightedQueueEstimateMaximumOffsetAdjuster(1.66),
      new TieredWeightedQueueEstimateAdjuster([5453, 5969, 9602, 9754], [0.94, 1.05, 0.84, 0.93]),
      new FlaggedWeightedQueueEstimateAdjuster(flagsValue, "weighted-queue-estimate-default", 9.8),
      new LabelWeightedQueueEstimateAdjuster(
        new Map<string, number>([["south", 0.88], ["east", 1.26], ["north", 0.97]]),
      ),
      new MinimumWeightedQueueEstimateAdjuster(5.4),
      new PercentWeightedQueueEstimateAdjuster(-8.7),
    ],
    [],
    0.5,
    12317.3,
  );
}
