import * as numbers from "../../../../kit/numbers.js";
import { SeasonalMacroProfile } from "./seasonal-macro-profile.js";

/** One step of the seasonal macro profile calculation. */
export interface SeasonalMacroProfileStep {
  describe(): string;
  adjust(item: SeasonalMacroProfile, value: number): number;
}

export class UnitSeasonalMacroProfileAdjuster implements SeasonalMacroProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: SeasonalMacroProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumSeasonalMacroProfileAdjuster implements SeasonalMacroProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalMacroProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalMacroProfileExpiresAtOffsetAdjuster implements SeasonalMacroProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: SeasonalMacroProfile, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class TieredSeasonalMacroProfileAdjuster implements SeasonalMacroProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalMacroProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal macro profile steps in order and keeps a trace of each. */
export class SeasonalMacroProfileEngine {
  steps: SeasonalMacroProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalMacroProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalMacroProfile): number {
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

  evaluateAll(items: SeasonalMacroProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalMacroProfileEngine(): SeasonalMacroProfileEngine {
  return new SeasonalMacroProfileEngine(
    [
      new UnitSeasonalMacroProfileAdjuster(new Map<string, number>([["south", 1.2], ["east", 0.98]])),
      new MinimumSeasonalMacroProfileAdjuster(44.9),
      new SeasonalMacroProfileExpiresAtOffsetAdjuster(0.64),
      new TieredSeasonalMacroProfileAdjuster([1892, 7064, 9997], [1.07, 1.14, 0.95]),
    ],
    [],
    1.8,
    11730.3,
  );
}
