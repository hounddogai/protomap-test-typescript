import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePayoutSlot } from "./adaptive-payout-slot.js";

/** One step of the adaptive payout slot calculation. */
export interface AdaptivePayoutSlotAdjuster {
  describe(): string;
  adjust(item: AdaptivePayoutSlot, value: number): number;
}

export class PercentAdaptivePayoutSlotAdjuster implements AdaptivePayoutSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePayoutSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptivePayoutSlotAdjuster implements AdaptivePayoutSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePayoutSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptivePayoutSlotAdjuster implements AdaptivePayoutSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptivePayoutSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptivePayoutSlotFloorValueOffsetAdjuster implements AdaptivePayoutSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: AdaptivePayoutSlot, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the adaptive payout slot steps in order and keeps a trace of each. */
export class AdaptivePayoutSlotEngine {
  steps: AdaptivePayoutSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePayoutSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptivePayoutSlot): number {
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

  evaluateAll(items: AdaptivePayoutSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptivePayoutSlotEngine(): AdaptivePayoutSlotEngine {
  return new AdaptivePayoutSlotEngine(
    [
      new PercentAdaptivePayoutSlotAdjuster(19.7),
      new TieredAdaptivePayoutSlotAdjuster([2754, 8966, 9389], [1.06, 1.09, 1.17]),
      new CapAdaptivePayoutSlotAdjuster(15946),
      new AdaptivePayoutSlotFloorValueOffsetAdjuster(1.88),
    ],
    [],
    2.4,
    89495,
  );
}
