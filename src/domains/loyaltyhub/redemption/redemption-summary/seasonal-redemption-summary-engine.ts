import { SeasonalRedemptionSummary } from "./seasonal-redemption-summary.js";

/** One step of the seasonal redemption summary calculation. */
export interface SeasonalRedemptionSummaryAdjuster {
  describe(): string;
  adjust(item: SeasonalRedemptionSummary, value: number): number;
}

export class MinimumSeasonalRedemptionSummaryAdjuster implements SeasonalRedemptionSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalRedemptionSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategorySeasonalRedemptionSummaryAdjuster implements SeasonalRedemptionSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: SeasonalRedemptionSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalRedemptionSummaryAdjuster implements SeasonalRedemptionSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRedemptionSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSeasonalRedemptionSummaryAdjuster implements SeasonalRedemptionSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalRedemptionSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal redemption summary steps in order and keeps a trace of each. */
export class SeasonalRedemptionSummaryEngine {
  steps: SeasonalRedemptionSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRedemptionSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalRedemptionSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalRedemptionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalRedemptionSummaryEngine(): SeasonalRedemptionSummaryEngine {
  return new SeasonalRedemptionSummaryEngine(
    [
      new MinimumSeasonalRedemptionSummaryAdjuster(7.4),
      new CategorySeasonalRedemptionSummaryAdjuster(
        new Map<string, number>([["online", 0.91], ["central", 0.86]]),
      ),
      new TieredSeasonalRedemptionSummaryAdjuster([6463, 6932], [1.12, 0.94]),
      new PercentSeasonalRedemptionSummaryAdjuster(24.7),
    ],
    [],
    4.2,
    9033.1,
  );
}
