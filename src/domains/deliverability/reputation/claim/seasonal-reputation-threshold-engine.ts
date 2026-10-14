import * as numbers from "../../../../kit/numbers.js";
import { SeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

/** One step of the seasonal reputation threshold calculation. */
export interface SeasonalReputationThresholdStep {
  describe(): string;
  adjust(item: SeasonalReputationThreshold, value: number): number;
}

export class RoundingSeasonalReputationThresholdAdjuster implements SeasonalReputationThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalReputationThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelSeasonalReputationThresholdAdjuster implements SeasonalReputationThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SeasonalReputationThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalReputationThresholdAdjuster implements SeasonalReputationThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalReputationThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSeasonalReputationThresholdAdjuster implements SeasonalReputationThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalReputationThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalReputationThresholdAdjuster implements SeasonalReputationThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalReputationThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalReputationThresholdAdjuster implements SeasonalReputationThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalReputationThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal reputation threshold steps in order and keeps a trace of each. */
export class SeasonalReputationThresholdEngine {
  steps: SeasonalReputationThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalReputationThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalReputationThreshold): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SeasonalReputationThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalReputationThresholdEngine(): SeasonalReputationThresholdEngine {
  return new SeasonalReputationThresholdEngine(
    [
      new RoundingSeasonalReputationThresholdAdjuster(1),
      new LabelSeasonalReputationThresholdAdjuster(
        new Map<string, number>([["online", 1.34], ["north", 1.03], ["retail", 0.85]]),
      ),
      new TieredSeasonalReputationThresholdAdjuster([67, 3054, 4647, 7755], [1.06, 0.94, 1.15, 1.14]),
      new PercentSeasonalReputationThresholdAdjuster(14),
      new CapSeasonalReputationThresholdAdjuster(7214),
      new MinimumSeasonalReputationThresholdAdjuster(19.9),
    ],
    [],
    3.8,
    24003.4,
  );
}
