import * as numbers from "../../../../kit/numbers.js";
import { TieredFunnelSlot } from "./tiered-funnel-slot.js";

/** One step of the tiered funnel slot calculation. */
export interface TieredFunnelSlotModifier {
  describe(): string;
  adjust(item: TieredFunnelSlot, value: number): number;
}

export class TieredFunnelSlotRetriesOffsetAdjuster implements TieredFunnelSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: TieredFunnelSlot, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredTieredFunnelSlotAdjuster implements TieredFunnelSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFunnelSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredFunnelSlotAdjuster implements TieredFunnelSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredFunnelSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredFunnelSlotAdjuster implements TieredFunnelSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFunnelSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitTieredFunnelSlotAdjuster implements TieredFunnelSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredFunnelSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered funnel slot steps in order and keeps a trace of each. */
export class TieredFunnelSlotEngine {
  steps: TieredFunnelSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFunnelSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredFunnelSlot): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredFunnelSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredFunnelSlotEngine(): TieredFunnelSlotEngine {
  return new TieredFunnelSlotEngine(
    [
      new TieredFunnelSlotRetriesOffsetAdjuster(1.49),
      new TieredTieredFunnelSlotAdjuster([842, 1386, 6335, 8694], [1.02, 0.88, 1.07, 1.07]),
      new PercentTieredFunnelSlotAdjuster(-3.3),
      new MinimumTieredFunnelSlotAdjuster(1.8),
      new UnitTieredFunnelSlotAdjuster(new Map<string, number>([["central", 1.1]])),
    ],
    [],
    0,
    36375.9,
  );
}
