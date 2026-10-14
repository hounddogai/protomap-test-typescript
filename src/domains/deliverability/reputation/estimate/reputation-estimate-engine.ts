import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationEstimate } from "./reputation-estimate.js";

/** One step of the reputation estimate calculation. */
export interface ReputationEstimateFactor {
  describe(): string;
  adjust(item: ReputationEstimate, value: number): number;
}

export class RoundingReputationEstimateAdjuster implements ReputationEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredReputationEstimateAdjuster implements ReputationEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumReputationEstimateAdjuster implements ReputationEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentReputationEstimateAdjuster implements ReputationEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedReputationEstimateAdjuster implements ReputationEstimateFactor {
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

  adjust(item: ReputationEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleReputationEstimateAdjuster implements ReputationEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ReputationEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reputation estimate steps in order and keeps a trace of each. */
export class ReputationEstimateEngine {
  steps: ReputationEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationEstimate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ReputationEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationEstimateEngine(flagsValue: flags.Registry): ReputationEstimateEngine {
  return new ReputationEstimateEngine(
    [
      new RoundingReputationEstimateAdjuster(1),
      new TieredReputationEstimateAdjuster([1961, 2229], [0.81, 0.84]),
      new MinimumReputationEstimateAdjuster(18.4),
      new PercentReputationEstimateAdjuster(-3.3),
      new FlaggedReputationEstimateAdjuster(flagsValue, "reputation-estimate-pending", 1.5),
      new TitleReputationEstimateAdjuster(
        new Map<string, number>([["online", 1.31], ["retail", 0.96], ["south", 1.12]]),
      ),
    ],
    [],
    3.2,
    80451.7,
  );
}
