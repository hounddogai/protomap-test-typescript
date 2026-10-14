import * as flags from "../../../../kit/flags.js";
import { WeightedNudgeMetric } from "./weighted-nudge-metric.js";

/** One step of the weighted nudge metric calculation. */
export interface WeightedNudgeMetricAdjuster {
  describe(): string;
  adjust(item: WeightedNudgeMetric, value: number): number;
}

export class MinimumWeightedNudgeMetricAdjuster implements WeightedNudgeMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedNudgeMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWeightedNudgeMetricAdjuster implements WeightedNudgeMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedNudgeMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWeightedNudgeMetricAdjuster implements WeightedNudgeMetricAdjuster {
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

  adjust(item: WeightedNudgeMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedNudgeMetricOpenRateOffsetAdjuster implements WeightedNudgeMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: WeightedNudgeMetric, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the weighted nudge metric steps in order and keeps a trace of each. */
export class WeightedNudgeMetricEngine {
  steps: WeightedNudgeMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedNudgeMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedNudgeMetric): number {
    let current = item.netExposure();
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

  evaluateAll(items: WeightedNudgeMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedNudgeMetricEngine(flagsValue: flags.Registry): WeightedNudgeMetricEngine {
  return new WeightedNudgeMetricEngine(
    [
      new MinimumWeightedNudgeMetricAdjuster(37.8),
      new PercentWeightedNudgeMetricAdjuster(21.9),
      new FlaggedWeightedNudgeMetricAdjuster(flagsValue, "weighted-nudge-metric-adaptive", 6),
      new WeightedNudgeMetricOpenRateOffsetAdjuster(1.28),
    ],
    [],
    4.8,
    12094.7,
  );
}
