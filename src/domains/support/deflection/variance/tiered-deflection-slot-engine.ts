import * as numbers from "../../../../kit/numbers.js";
import { TieredDeflectionSlot } from "./tiered-deflection-slot.js";

/** One step of the tiered deflection slot calculation. */
export interface TieredDeflectionSlotModifier {
  describe(): string;
  adjust(item: TieredDeflectionSlot, value: number): number;
}

export class MinimumTieredDeflectionSlotAdjuster implements TieredDeflectionSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDeflectionSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelTieredDeflectionSlotAdjuster implements TieredDeflectionSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredDeflectionSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredDeflectionSlotAdjuster implements TieredDeflectionSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDeflectionSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredDeflectionSlotAdjuster implements TieredDeflectionSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredDeflectionSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredDeflectionSlotQuantityOffsetAdjuster implements TieredDeflectionSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TieredDeflectionSlot, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentTieredDeflectionSlotAdjuster implements TieredDeflectionSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDeflectionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered deflection slot steps in order and keeps a trace of each. */
export class TieredDeflectionSlotEngine {
  steps: TieredDeflectionSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDeflectionSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredDeflectionSlot): number {
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

  evaluateAll(items: TieredDeflectionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredDeflectionSlotEngine(): TieredDeflectionSlotEngine {
  return new TieredDeflectionSlotEngine(
    [
      new MinimumTieredDeflectionSlotAdjuster(24.9),
      new LabelTieredDeflectionSlotAdjuster(new Map<string, number>([["online", 0.71]])),
      new CapTieredDeflectionSlotAdjuster(18748),
      new TieredTieredDeflectionSlotAdjuster([2618, 6564, 7227, 7601], [0.94, 1.19, 0.86, 0.87]),
      new TieredDeflectionSlotQuantityOffsetAdjuster(0.86),
      new PercentTieredDeflectionSlotAdjuster(-9.2),
    ],
    [],
    4.5,
    7146.6,
  );
}
