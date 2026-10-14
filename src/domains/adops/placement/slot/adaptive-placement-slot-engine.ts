import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePlacementSlot } from "./adaptive-placement-slot.js";

/** One step of the adaptive placement slot calculation. */
export interface AdaptivePlacementSlotStep {
  describe(): string;
  adjust(item: AdaptivePlacementSlot, value: number): number;
}

export class CategoryAdaptivePlacementSlotAdjuster implements AdaptivePlacementSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: AdaptivePlacementSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentAdaptivePlacementSlotAdjuster implements AdaptivePlacementSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePlacementSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptivePlacementSlotAdjuster implements AdaptivePlacementSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePlacementSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptivePlacementSlotAdjuster implements AdaptivePlacementSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptivePlacementSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptivePlacementSlotMinimumOffsetAdjuster implements AdaptivePlacementSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: AdaptivePlacementSlot, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the adaptive placement slot steps in order and keeps a trace of each. */
export class AdaptivePlacementSlotEngine {
  steps: AdaptivePlacementSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePlacementSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptivePlacementSlot): number {
    let current = item.netValue();
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

  evaluateAll(items: AdaptivePlacementSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptivePlacementSlotEngine(): AdaptivePlacementSlotEngine {
  return new AdaptivePlacementSlotEngine(
    [
      new CategoryAdaptivePlacementSlotAdjuster(new Map<string, number>([["north", 0.94]])),
      new PercentAdaptivePlacementSlotAdjuster(-24),
      new TieredAdaptivePlacementSlotAdjuster([1402, 4432, 6926], [1.04, 0.88, 1.15]),
      new CapAdaptivePlacementSlotAdjuster(26202),
      new AdaptivePlacementSlotMinimumOffsetAdjuster(1.8),
    ],
    [],
    2.9,
    63077.7,
  );
}
