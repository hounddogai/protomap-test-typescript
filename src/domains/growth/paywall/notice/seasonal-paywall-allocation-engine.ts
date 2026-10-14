import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

/** One step of the seasonal paywall allocation calculation. */
export interface SeasonalPaywallAllocationModifier {
  describe(): string;
  adjust(item: SeasonalPaywallAllocation, value: number): number;
}

export class PercentSeasonalPaywallAllocationAdjuster implements SeasonalPaywallAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalPaywallAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalPaywallAllocationCostOffsetAdjuster implements SeasonalPaywallAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: SeasonalPaywallAllocation, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumSeasonalPaywallAllocationAdjuster implements SeasonalPaywallAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPaywallAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalPaywallAllocationAdjuster implements SeasonalPaywallAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalPaywallAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal paywall allocation steps in order and keeps a trace of each. */
export class SeasonalPaywallAllocationEngine {
  steps: SeasonalPaywallAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPaywallAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalPaywallAllocation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalPaywallAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalPaywallAllocationEngine(): SeasonalPaywallAllocationEngine {
  return new SeasonalPaywallAllocationEngine(
    [
      new PercentSeasonalPaywallAllocationAdjuster(-5.4),
      new SeasonalPaywallAllocationCostOffsetAdjuster(1.18),
      new MinimumSeasonalPaywallAllocationAdjuster(37.1),
      new TieredSeasonalPaywallAllocationAdjuster([4847, 5064, 7943], [0.97, 0.85, 1.09]),
    ],
    [],
    3.6,
    51920.5,
  );
}
