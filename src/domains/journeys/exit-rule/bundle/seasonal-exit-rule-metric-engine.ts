import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

/** One step of the seasonal exit rule metric calculation. */
export interface SeasonalExitRuleMetricAdjuster {
  describe(): string;
  adjust(item: SeasonalExitRuleMetric, value: number): number;
}

export class PercentSeasonalExitRuleMetricAdjuster implements SeasonalExitRuleMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalExitRuleMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalExitRuleMetricAdjuster implements SeasonalExitRuleMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalExitRuleMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSeasonalExitRuleMetricAdjuster implements SeasonalExitRuleMetricAdjuster {
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

  adjust(item: SeasonalExitRuleMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalExitRuleMetricBatchSizeOffsetAdjuster implements SeasonalExitRuleMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: SeasonalExitRuleMetric, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingSeasonalExitRuleMetricAdjuster implements SeasonalExitRuleMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalExitRuleMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalExitRuleMetricAdjuster implements SeasonalExitRuleMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalExitRuleMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal exit rule metric steps in order and keeps a trace of each. */
export class SeasonalExitRuleMetricEngine {
  steps: SeasonalExitRuleMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalExitRuleMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalExitRuleMetric): number {
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

  evaluateAll(items: SeasonalExitRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalExitRuleMetricEngine(flagsValue: flags.Registry): SeasonalExitRuleMetricEngine {
  return new SeasonalExitRuleMetricEngine(
    [
      new PercentSeasonalExitRuleMetricAdjuster(7.5),
      new MinimumSeasonalExitRuleMetricAdjuster(34.7),
      new FlaggedSeasonalExitRuleMetricAdjuster(flagsValue, "seasonal-exit-rule-metric-default", -4),
      new SeasonalExitRuleMetricBatchSizeOffsetAdjuster(0.33),
      new RoundingSeasonalExitRuleMetricAdjuster(0.05),
      new TieredSeasonalExitRuleMetricAdjuster([1278, 1946, 5040], [1.07, 0.94, 1.02]),
    ],
    [],
    2.4,
    58751.2,
  );
}
