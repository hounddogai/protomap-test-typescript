import * as numbers from "../../../../kit/numbers.js";
import { SeasonalReputationVariance } from "./seasonal-reputation-variance.js";

/** One step of the seasonal reputation variance calculation. */
export interface SeasonalReputationVarianceModifier {
  describe(): string;
  adjust(item: SeasonalReputationVariance, value: number): number;
}

export class RoundingSeasonalReputationVarianceAdjuster implements SeasonalReputationVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalReputationVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSeasonalReputationVarianceAdjuster implements SeasonalReputationVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalReputationVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalReputationVarianceExpiresAtOffsetAdjuster implements SeasonalReputationVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: SeasonalReputationVariance, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class TieredSeasonalReputationVarianceAdjuster implements SeasonalReputationVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalReputationVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal reputation variance steps in order and keeps a trace of each. */
export class SeasonalReputationVarianceEngine {
  steps: SeasonalReputationVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalReputationVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalReputationVariance): number {
    let current = item.projectedValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: SeasonalReputationVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalReputationVarianceEngine(): SeasonalReputationVarianceEngine {
  return new SeasonalReputationVarianceEngine(
    [
      new RoundingSeasonalReputationVarianceAdjuster(0.5),
      new MinimumSeasonalReputationVarianceAdjuster(24.3),
      new SeasonalReputationVarianceExpiresAtOffsetAdjuster(0.73),
      new TieredSeasonalReputationVarianceAdjuster([536, 9660], [1.1, 0.98]),
    ],
    [],
    4.5,
    46749.2,
  );
}
