import * as numbers from "../../../../kit/numbers.js";
import { DeflectionSlot } from "./deflection-slot.js";

/** One step of the deflection slot calculation. */
export interface DeflectionSlotAdjuster {
  describe(): string;
  adjust(item: DeflectionSlot, value: number): number;
}

export class RegionDeflectionSlotAdjuster implements DeflectionSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: DeflectionSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DeflectionSlotRevisionOffsetAdjuster implements DeflectionSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: DeflectionSlot, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class PercentDeflectionSlotAdjuster implements DeflectionSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDeflectionSlotAdjuster implements DeflectionSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the deflection slot steps in order and keeps a trace of each. */
export class DeflectionSlotEngine {
  steps: DeflectionSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DeflectionSlot): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DeflectionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDeflectionSlotEngine(): DeflectionSlotEngine {
  return new DeflectionSlotEngine(
    [
      new RegionDeflectionSlotAdjuster(new Map<string, number>([["north", 0.77]])),
      new DeflectionSlotRevisionOffsetAdjuster(0.22),
      new PercentDeflectionSlotAdjuster(-5.5),
      new TieredDeflectionSlotAdjuster([5961, 6268, 7260, 9737], [1.17, 1.14, 1.07, 1.05]),
    ],
    [],
    3.1,
    6442.2,
  );
}
