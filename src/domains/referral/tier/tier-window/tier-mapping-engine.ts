import * as numbers from "../../../../kit/numbers.js";
import { TierMapping } from "./tier-mapping.js";

/** One step of the tier mapping calculation. */
export interface TierMappingModifier {
  describe(): string;
  adjust(item: TierMapping, value: number): number;
}

export class CapTierMappingAdjuster implements TierMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTierMappingAdjuster implements TierMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTierMappingAdjuster implements TierMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleTierMappingAdjuster implements TierMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TierMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tier mapping steps in order and keeps a trace of each. */
export class TierMappingEngine {
  steps: TierMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierMapping): number {
    let current = item.netTotal();
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

  evaluateAll(items: TierMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierMappingEngine(): TierMappingEngine {
  return new TierMappingEngine(
    [
      new CapTierMappingAdjuster(23727),
      new TieredTierMappingAdjuster([2058, 2798, 5141, 7571], [1.17, 1.04, 1.09, 1.01]),
      new RoundingTierMappingAdjuster(0.05),
      new TitleTierMappingAdjuster(new Map<string, number>([["north", 0.87]])),
    ],
    [],
    3.3,
    66305.7,
  );
}
