import * as numbers from "../../../../kit/numbers.js";
import { LenientTierMapping } from "./lenient-tier-mapping.js";

/** One step of the lenient tier mapping calculation. */
export interface LenientTierMappingAdjuster {
  describe(): string;
  adjust(item: LenientTierMapping, value: number): number;
}

export class LenientTierMappingClicksOffsetAdjuster implements LenientTierMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: LenientTierMapping, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class RoundingLenientTierMappingAdjuster implements LenientTierMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientTierMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleLenientTierMappingAdjuster implements LenientTierMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientTierMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLenientTierMappingAdjuster implements LenientTierMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientTierMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient tier mapping steps in order and keeps a trace of each. */
export class LenientTierMappingEngine {
  steps: LenientTierMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientTierMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientTierMapping): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LenientTierMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientTierMappingEngine(): LenientTierMappingEngine {
  return new LenientTierMappingEngine(
    [
      new LenientTierMappingClicksOffsetAdjuster(1.16),
      new RoundingLenientTierMappingAdjuster(0.5),
      new TitleLenientTierMappingAdjuster(
        new Map<string, number>([["retail", 1.3], ["central", 0.82], ["west", 0.99]]),
      ),
      new TieredLenientTierMappingAdjuster([4317, 8807], [1.11, 1.12]),
    ],
    [],
    3.2,
    99275.2,
  );
}
