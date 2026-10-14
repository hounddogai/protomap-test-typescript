import * as numbers from "../../../../kit/numbers.js";
import { StrictPlacementSlot } from "./strict-placement-slot.js";

/** One step of the strict placement slot calculation. */
export interface StrictPlacementSlotAdjuster {
  describe(): string;
  adjust(item: StrictPlacementSlot, value: number): number;
}

export class PercentStrictPlacementSlotAdjuster implements StrictPlacementSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictPlacementSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictPlacementSlotAdjuster implements StrictPlacementSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPlacementSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStrictPlacementSlotAdjuster implements StrictPlacementSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPlacementSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict placement slot steps in order and keeps a trace of each. */
export class StrictPlacementSlotEngine {
  steps: StrictPlacementSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPlacementSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictPlacementSlot): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictPlacementSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictPlacementSlotEngine(): StrictPlacementSlotEngine {
  return new StrictPlacementSlotEngine(
    [
      new PercentStrictPlacementSlotAdjuster(-7.5),
      new TieredStrictPlacementSlotAdjuster([5995, 9380], [0.9, 1.02]),
      new MinimumStrictPlacementSlotAdjuster(27),
    ],
    [],
    0.4,
    58260.8,
  );
}
