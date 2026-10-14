import { WeightedQueueMapping } from "./weighted-queue-mapping.js";

/** One step of the weighted queue mapping calculation. */
export interface WeightedQueueMappingAdjuster {
  describe(): string;
  adjust(item: WeightedQueueMapping, value: number): number;
}

export class PercentWeightedQueueMappingAdjuster implements WeightedQueueMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedQueueMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedQueueMappingAdjuster implements WeightedQueueMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedQueueMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedQueueMappingAdjuster implements WeightedQueueMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedQueueMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted queue mapping steps in order and keeps a trace of each. */
export class WeightedQueueMappingEngine {
  steps: WeightedQueueMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedQueueMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedQueueMapping): number {
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

  evaluateAll(items: WeightedQueueMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedQueueMappingEngine(): WeightedQueueMappingEngine {
  return new WeightedQueueMappingEngine(
    [
      new PercentWeightedQueueMappingAdjuster(-12),
      new CapWeightedQueueMappingAdjuster(7918),
      new TieredWeightedQueueMappingAdjuster([3265, 7877, 8994, 9602], [1.02, 0.85, 0.92, 0.97]),
    ],
    [],
    4.6,
    90655.2,
  );
}
