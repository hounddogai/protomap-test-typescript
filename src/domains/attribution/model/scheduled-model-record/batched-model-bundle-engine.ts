import * as flags from "../../../../kit/flags.js";
import { BatchedModelBundle } from "./batched-model-bundle.js";

/** One step of the batched model bundle calculation. */
export interface BatchedModelBundleModifier {
  describe(): string;
  adjust(item: BatchedModelBundle, value: number): number;
}

export class ChannelBatchedModelBundleAdjuster implements BatchedModelBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BatchedModelBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedModelBundleAdjuster implements BatchedModelBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedModelBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedModelBundleAdjuster implements BatchedModelBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedModelBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedModelBundlePriorityOffsetAdjuster implements BatchedModelBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: BatchedModelBundle, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedBatchedModelBundleAdjuster implements BatchedModelBundleModifier {
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

  adjust(item: BatchedModelBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedModelBundleAdjuster implements BatchedModelBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedModelBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched model bundle steps in order and keeps a trace of each. */
export class BatchedModelBundleEngine {
  steps: BatchedModelBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedModelBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedModelBundle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BatchedModelBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedModelBundleEngine(flagsValue: flags.Registry): BatchedModelBundleEngine {
  return new BatchedModelBundleEngine(
    [
      new ChannelBatchedModelBundleAdjuster(new Map<string, number>([["north", 1.37], ["east", 1.05]])),
      new MinimumBatchedModelBundleAdjuster(44),
      new TieredBatchedModelBundleAdjuster([1171, 5651], [1.16, 1.1]),
      new BatchedModelBundlePriorityOffsetAdjuster(1.51),
      new FlaggedBatchedModelBundleAdjuster(flagsValue, "batched-model-bundle-regional", 8.4),
      new CapBatchedModelBundleAdjuster(45861),
    ],
    [],
    0.4,
    33103.4,
  );
}
