import * as numbers from "../../../../kit/numbers.js";
import { FallbackFunnelBatch } from "./fallback-funnel-batch.js";

/** One step of the fallback funnel batch calculation. */
export interface FallbackFunnelBatchStep {
  describe(): string;
  adjust(item: FallbackFunnelBatch, value: number): number;
}

export class FallbackFunnelBatchBidOffsetAdjuster implements FallbackFunnelBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: FallbackFunnelBatch, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CountryFallbackFunnelBatchAdjuster implements FallbackFunnelBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FallbackFunnelBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackFunnelBatchAdjuster implements FallbackFunnelBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFunnelBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFallbackFunnelBatchAdjuster implements FallbackFunnelBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFunnelBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback funnel batch steps in order and keeps a trace of each. */
export class FallbackFunnelBatchEngine {
  steps: FallbackFunnelBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFunnelBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackFunnelBatch): number {
    let current = item.netExposure();
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

  evaluateAll(items: FallbackFunnelBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackFunnelBatchEngine(): FallbackFunnelBatchEngine {
  return new FallbackFunnelBatchEngine(
    [
      new FallbackFunnelBatchBidOffsetAdjuster(1.42),
      new CountryFallbackFunnelBatchAdjuster(new Map<string, number>([["retail", 1.35]])),
      new TieredFallbackFunnelBatchAdjuster([148, 5176, 8432, 9652], [1.16, 1.12, 1.17, 1.19]),
      new PercentFallbackFunnelBatchAdjuster(23.1),
    ],
    [],
    0.2,
    48094.4,
  );
}
