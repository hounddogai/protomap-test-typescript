import * as flags from "../../../../kit/flags.js";
import { ReputationMetric } from "./reputation-metric.js";

/** One step of the reputation metric calculation. */
export interface ReputationMetricFactor {
  describe(): string;
  adjust(item: ReputationMetric, value: number): number;
}

export class FlaggedReputationMetricAdjuster implements ReputationMetricFactor {
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

  adjust(item: ReputationMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReputationMetricAdjuster implements ReputationMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentReputationMetricAdjuster implements ReputationMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation metric steps in order and keeps a trace of each. */
export class ReputationMetricEngine {
  steps: ReputationMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationMetric): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ReputationMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationMetricEngine(flagsValue: flags.Registry): ReputationMetricEngine {
  return new ReputationMetricEngine(
    [
      new FlaggedReputationMetricAdjuster(flagsValue, "reputation-metric-manual", -9.6),
      new TieredReputationMetricAdjuster([1092, 4019, 6526, 7167], [0.96, 1.19, 0.89, 1.02]),
      new PercentReputationMetricAdjuster(-14),
    ],
    [],
    0.2,
    80429,
  );
}
