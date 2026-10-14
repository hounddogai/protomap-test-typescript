import * as numbers from "../../../../kit/numbers.js";
import { SeasonalRedemptionThreshold } from "./seasonal-redemption-threshold.js";

/** One step of the seasonal redemption threshold calculation. */
export interface SeasonalRedemptionThresholdStep {
  describe(): string;
  adjust(item: SeasonalRedemptionThreshold, value: number): number;
}

export class RoundingSeasonalRedemptionThresholdAdjuster implements SeasonalRedemptionThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalRedemptionThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceSeasonalRedemptionThresholdAdjuster implements SeasonalRedemptionThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: SeasonalRedemptionThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalRedemptionThresholdAdjuster implements SeasonalRedemptionThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRedemptionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalRedemptionThresholdVersionOffsetAdjuster implements SeasonalRedemptionThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SeasonalRedemptionThreshold, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the seasonal redemption threshold steps in order and keeps a trace of each. */
export class SeasonalRedemptionThresholdEngine {
  steps: SeasonalRedemptionThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRedemptionThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalRedemptionThreshold): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: SeasonalRedemptionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalRedemptionThresholdEngine(): SeasonalRedemptionThresholdEngine {
  return new SeasonalRedemptionThresholdEngine(
    [
      new RoundingSeasonalRedemptionThresholdAdjuster(0.5),
      new UtmSourceSeasonalRedemptionThresholdAdjuster(
        new Map<string, number>([["north", 0.73], ["east", 0.82]]),
      ),
      new TieredSeasonalRedemptionThresholdAdjuster([2535, 5348, 5419, 8649], [1.17, 1, 1.03, 1.07]),
      new SeasonalRedemptionThresholdVersionOffsetAdjuster(1.32),
    ],
    [],
    2,
    81147.5,
  );
}
