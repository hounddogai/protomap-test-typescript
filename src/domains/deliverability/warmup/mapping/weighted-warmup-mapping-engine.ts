import { WeightedWarmupMapping } from "./weighted-warmup-mapping.js";

/** One step of the weighted warmup mapping calculation. */
export interface WeightedWarmupMappingStep {
  describe(): string;
  adjust(item: WeightedWarmupMapping, value: number): number;
}

export class CapWeightedWarmupMappingAdjuster implements WeightedWarmupMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWarmupMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedWarmupMappingAdjuster implements WeightedWarmupMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWarmupMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameWeightedWarmupMappingAdjuster implements WeightedWarmupMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WeightedWarmupMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedWarmupMappingAdjuster implements WeightedWarmupMappingStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWarmupMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted warmup mapping steps in order and keeps a trace of each. */
export class WeightedWarmupMappingEngine {
  steps: WeightedWarmupMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWarmupMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWarmupMapping): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WeightedWarmupMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWarmupMappingEngine(): WeightedWarmupMappingEngine {
  return new WeightedWarmupMappingEngine(
    [
      new CapWeightedWarmupMappingAdjuster(29958),
      new TieredWeightedWarmupMappingAdjuster([1691, 4727], [1.14, 1.1]),
      new NameWeightedWarmupMappingAdjuster(
        new Map<string, number>([["south", 0.88], ["west", 1.34], ["central", 1.25]]),
      ),
      new MinimumWeightedWarmupMappingAdjuster(14.7),
    ],
    [],
    1,
    29436.3,
  );
}
