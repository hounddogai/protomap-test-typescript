import * as numbers from "../../../../kit/numbers.js";
import { RegionalPlacementAllocation } from "./regional-placement-allocation.js";

/** One step of the regional placement allocation calculation. */
export interface RegionalPlacementAllocationStep {
  describe(): string;
  adjust(item: RegionalPlacementAllocation, value: number): number;
}

export class PercentRegionalPlacementAllocationAdjuster implements RegionalPlacementAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPlacementAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionalPlacementAllocationPriorityOffsetAdjuster implements RegionalPlacementAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RegionalPlacementAllocation, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TitleRegionalPlacementAllocationAdjuster implements RegionalPlacementAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalPlacementAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalPlacementAllocationAdjuster implements RegionalPlacementAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPlacementAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalPlacementAllocationAdjuster implements RegionalPlacementAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPlacementAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional placement allocation steps in order and keeps a trace of each. */
export class RegionalPlacementAllocationEngine {
  steps: RegionalPlacementAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPlacementAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPlacementAllocation): number {
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

  evaluateAll(items: RegionalPlacementAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPlacementAllocationEngine(): RegionalPlacementAllocationEngine {
  return new RegionalPlacementAllocationEngine(
    [
      new PercentRegionalPlacementAllocationAdjuster(20.5),
      new RegionalPlacementAllocationPriorityOffsetAdjuster(1.96),
      new TitleRegionalPlacementAllocationAdjuster(
        new Map<string, number>([["retail", 1.37], ["north", 0.9], ["east", 0.89]]),
      ),
      new RoundingRegionalPlacementAllocationAdjuster(5),
      new TieredRegionalPlacementAllocationAdjuster([3410, 4231, 6336], [0.96, 1.04, 0.95]),
    ],
    [],
    1.3,
    41666.4,
  );
}
