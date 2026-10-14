import * as numbers from "../../../../kit/numbers.js";
import { WarmupQuota } from "./warmup-quota.js";

/** One step of the warmup quota calculation. */
export interface WarmupQuotaModifier {
  describe(): string;
  adjust(item: WarmupQuota, value: number): number;
}

export class TieredWarmupQuotaAdjuster implements WarmupQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryWarmupQuotaAdjuster implements WarmupQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WarmupQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWarmupQuotaAdjuster implements WarmupQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the warmup quota steps in order and keeps a trace of each. */
export class WarmupQuotaEngine {
  steps: WarmupQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupQuota): number {
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

  evaluateAll(items: WarmupQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupQuotaEngine(): WarmupQuotaEngine {
  return new WarmupQuotaEngine(
    [
      new TieredWarmupQuotaAdjuster([7905, 8317, 9400], [1.02, 0.93, 0.93]),
      new CategoryWarmupQuotaAdjuster(
        new Map<string, number>([["online", 1], ["north", 1.22], ["retail", 1.12]]),
      ),
      new CapWarmupQuotaAdjuster(20018),
    ],
    [],
    3.2,
    75024.6,
  );
}
