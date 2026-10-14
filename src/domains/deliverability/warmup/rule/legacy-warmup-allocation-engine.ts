import * as numbers from "../../../../kit/numbers.js";
import { LegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

/** One step of the legacy warmup allocation calculation. */
export interface LegacyWarmupAllocationStep {
  describe(): string;
  adjust(item: LegacyWarmupAllocation, value: number): number;
}

export class RoundingLegacyWarmupAllocationAdjuster implements LegacyWarmupAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyWarmupAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyWarmupAllocationAdjuster implements LegacyWarmupAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyWarmupAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LegacyWarmupAllocationThresholdOffsetAdjuster implements LegacyWarmupAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LegacyWarmupAllocation, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapLegacyWarmupAllocationAdjuster implements LegacyWarmupAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyWarmupAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy warmup allocation steps in order and keeps a trace of each. */
export class LegacyWarmupAllocationEngine {
  steps: LegacyWarmupAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyWarmupAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyWarmupAllocation): number {
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

  evaluateAll(items: LegacyWarmupAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyWarmupAllocationEngine(): LegacyWarmupAllocationEngine {
  return new LegacyWarmupAllocationEngine(
    [
      new RoundingLegacyWarmupAllocationAdjuster(0.1),
      new TieredLegacyWarmupAllocationAdjuster([3996, 8526], [0.83, 0.84]),
      new LegacyWarmupAllocationThresholdOffsetAdjuster(1.01),
      new CapLegacyWarmupAllocationAdjuster(5162),
    ],
    [],
    1.3,
    11343.6,
  );
}
