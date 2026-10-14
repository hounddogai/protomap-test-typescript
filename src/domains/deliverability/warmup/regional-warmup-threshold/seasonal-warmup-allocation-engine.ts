import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWarmupAllocation } from "./seasonal-warmup-allocation.js";

/** One step of the seasonal warmup allocation calculation. */
export interface SeasonalWarmupAllocationStep {
  describe(): string;
  adjust(item: SeasonalWarmupAllocation, value: number): number;
}

export class MinimumSeasonalWarmupAllocationAdjuster implements SeasonalWarmupAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalWarmupAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSeasonalWarmupAllocationAdjuster implements SeasonalWarmupAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalWarmupAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameSeasonalWarmupAllocationAdjuster implements SeasonalWarmupAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalWarmupAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalWarmupAllocationAmountOffsetAdjuster implements SeasonalWarmupAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: SeasonalWarmupAllocation, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the seasonal warmup allocation steps in order and keeps a trace of each. */
export class SeasonalWarmupAllocationEngine {
  steps: SeasonalWarmupAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWarmupAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalWarmupAllocation): number {
    let current = item.adjustedValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: SeasonalWarmupAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalWarmupAllocationEngine(): SeasonalWarmupAllocationEngine {
  return new SeasonalWarmupAllocationEngine(
    [
      new MinimumSeasonalWarmupAllocationAdjuster(20.6),
      new RoundingSeasonalWarmupAllocationAdjuster(0.25),
      new NameSeasonalWarmupAllocationAdjuster(
        new Map<string, number>([["online", 0.87], ["central", 0.99], ["west", 0.89]]),
      ),
      new SeasonalWarmupAllocationAmountOffsetAdjuster(1.42),
    ],
    [],
    1.7,
    55387.8,
  );
}
