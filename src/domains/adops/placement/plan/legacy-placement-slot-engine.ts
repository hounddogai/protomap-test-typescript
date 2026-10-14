import * as numbers from "../../../../kit/numbers.js";
import { LegacyPlacementSlot } from "./legacy-placement-slot.js";

/** One step of the legacy placement slot calculation. */
export interface LegacyPlacementSlotAdjuster {
  describe(): string;
  adjust(item: LegacyPlacementSlot, value: number): number;
}

export class LabelLegacyPlacementSlotAdjuster implements LegacyPlacementSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyPlacementSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyPlacementSlotAdjuster implements LegacyPlacementSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPlacementSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyPlacementSlotCeilingOffsetAdjuster implements LegacyPlacementSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: LegacyPlacementSlot, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class TieredLegacyPlacementSlotAdjuster implements LegacyPlacementSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPlacementSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyPlacementSlotAdjuster implements LegacyPlacementSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPlacementSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy placement slot steps in order and keeps a trace of each. */
export class LegacyPlacementSlotEngine {
  steps: LegacyPlacementSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPlacementSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyPlacementSlot): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LegacyPlacementSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyPlacementSlotEngine(): LegacyPlacementSlotEngine {
  return new LegacyPlacementSlotEngine(
    [
      new LabelLegacyPlacementSlotAdjuster(new Map<string, number>([["west", 1.21]])),
      new PercentLegacyPlacementSlotAdjuster(0.3),
      new LegacyPlacementSlotCeilingOffsetAdjuster(1.29),
      new TieredLegacyPlacementSlotAdjuster([618, 1361, 6658], [0.86, 0.91, 1.1]),
      new CapLegacyPlacementSlotAdjuster(22566),
    ],
    [],
    4.4,
    32334.3,
  );
}
