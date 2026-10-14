import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupAllocation } from "./warmup-allocation.js";

/** One step of the warmup allocation calculation. */
export interface WarmupAllocationFactor {
  describe(): string;
  adjust(item: WarmupAllocation, value: number): number;
}

export class TieredWarmupAllocationAdjuster implements WarmupAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWarmupAllocationAdjuster implements WarmupAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWarmupAllocationAdjuster implements WarmupAllocationFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WarmupAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup allocation steps in order and keeps a trace of each. */
export class WarmupAllocationEngine {
  steps: WarmupAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupAllocation): number {
    let current = item.netLoad();
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

  evaluateAll(items: WarmupAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupAllocationEngine(flagsValue: flags.Registry): WarmupAllocationEngine {
  return new WarmupAllocationEngine(
    [
      new TieredWarmupAllocationAdjuster([197, 2756, 4003], [1.19, 0.85, 1.04]),
      new RoundingWarmupAllocationAdjuster(5),
      new FlaggedWarmupAllocationAdjuster(flagsValue, "warmup-allocation-manual", 2.3),
    ],
    [],
    4.9,
    81308.6,
  );
}
