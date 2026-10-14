import { BatchedDeflectionBundle } from "./batched-deflection-bundle.js";

/** One step of the batched deflection bundle calculation. */
export interface BatchedDeflectionBundleAdjuster {
  describe(): string;
  adjust(item: BatchedDeflectionBundle, value: number): number;
}

export class LabelBatchedDeflectionBundleAdjuster implements BatchedDeflectionBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedDeflectionBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedDeflectionBundleAdjuster implements BatchedDeflectionBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedDeflectionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedDeflectionBundleAdjuster implements BatchedDeflectionBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedDeflectionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedDeflectionBundleAdjuster implements BatchedDeflectionBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedDeflectionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched deflection bundle steps in order and keeps a trace of each. */
export class BatchedDeflectionBundleEngine {
  steps: BatchedDeflectionBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDeflectionBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedDeflectionBundle): number {
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

  evaluateAll(items: BatchedDeflectionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedDeflectionBundleEngine(): BatchedDeflectionBundleEngine {
  return new BatchedDeflectionBundleEngine(
    [
      new LabelBatchedDeflectionBundleAdjuster(new Map<string, number>([["retail", 1.05], ["central", 1.19]])),
      new CapBatchedDeflectionBundleAdjuster(42047),
      new PercentBatchedDeflectionBundleAdjuster(9.2),
      new TieredBatchedDeflectionBundleAdjuster([937, 4787], [1.11, 1.07]),
    ],
    [],
    3.7,
    2677.9,
  );
}
