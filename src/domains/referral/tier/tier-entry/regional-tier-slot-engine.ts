import * as numbers from "../../../../kit/numbers.js";
import { RegionalTierSlot } from "./regional-tier-slot.js";

/** One step of the regional tier slot calculation. */
export interface RegionalTierSlotFactor {
  describe(): string;
  adjust(item: RegionalTierSlot, value: number): number;
}

export class MinimumRegionalTierSlotAdjuster implements RegionalTierSlotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalTierSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalTierSlotAdjuster implements RegionalTierSlotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalTierSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryRegionalTierSlotAdjuster implements RegionalTierSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RegionalTierSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RegionalTierSlotVersionOffsetAdjuster implements RegionalTierSlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RegionalTierSlot, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the regional tier slot steps in order and keeps a trace of each. */
export class RegionalTierSlotEngine {
  steps: RegionalTierSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalTierSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalTierSlot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RegionalTierSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalTierSlotEngine(): RegionalTierSlotEngine {
  return new RegionalTierSlotEngine(
    [
      new MinimumRegionalTierSlotAdjuster(39.4),
      new RoundingRegionalTierSlotAdjuster(1),
      new CountryRegionalTierSlotAdjuster(new Map<string, number>([["retail", 0.85]])),
      new RegionalTierSlotVersionOffsetAdjuster(0.32),
    ],
    [],
    2.5,
    77832.6,
  );
}
