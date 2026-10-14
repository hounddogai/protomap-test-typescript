import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveLeaderboardMetric } from "./adaptive-leaderboard-metric.js";

/** One step of the adaptive leaderboard metric calculation. */
export interface AdaptiveLeaderboardMetricStep {
  describe(): string;
  adjust(item: AdaptiveLeaderboardMetric, value: number): number;
}

export class PercentAdaptiveLeaderboardMetricAdjuster implements AdaptiveLeaderboardMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveLeaderboardMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveLeaderboardMetricAdjuster implements AdaptiveLeaderboardMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveLeaderboardMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameAdaptiveLeaderboardMetricAdjuster implements AdaptiveLeaderboardMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveLeaderboardMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveLeaderboardMetricAdjuster implements AdaptiveLeaderboardMetricStep {
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

  adjust(item: AdaptiveLeaderboardMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveLeaderboardMetricAdjuster implements AdaptiveLeaderboardMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveLeaderboardMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveLeaderboardMetricAdjuster implements AdaptiveLeaderboardMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveLeaderboardMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive leaderboard metric steps in order and keeps a trace of each. */
export class AdaptiveLeaderboardMetricEngine {
  steps: AdaptiveLeaderboardMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveLeaderboardMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveLeaderboardMetric): number {
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

  evaluateAll(items: AdaptiveLeaderboardMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveLeaderboardMetricEngine(flagsValue: flags.Registry): AdaptiveLeaderboardMetricEngine {
  return new AdaptiveLeaderboardMetricEngine(
    [
      new PercentAdaptiveLeaderboardMetricAdjuster(5),
      new MinimumAdaptiveLeaderboardMetricAdjuster(12.6),
      new NameAdaptiveLeaderboardMetricAdjuster(new Map<string, number>([["south", 1.1]])),
      new FlaggedAdaptiveLeaderboardMetricAdjuster(flagsValue, "adaptive-leaderboard-metric-batched", 5.8),
      new TieredAdaptiveLeaderboardMetricAdjuster([1785, 4808, 8662], [0.86, 0.84, 1.16]),
      new RoundingAdaptiveLeaderboardMetricAdjuster(1),
    ],
    [],
    1.5,
    42898.8,
  );
}
