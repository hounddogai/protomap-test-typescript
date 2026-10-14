import { AdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

/** One step of the adaptive complaint metric calculation. */
export interface AdaptiveComplaintMetricAdjuster {
  describe(): string;
  adjust(item: AdaptiveComplaintMetric, value: number): number;
}

export class AdaptiveComplaintMetricLimitOffsetAdjuster implements AdaptiveComplaintMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: AdaptiveComplaintMetric, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class PercentAdaptiveComplaintMetricAdjuster implements AdaptiveComplaintMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveComplaintMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleAdaptiveComplaintMetricAdjuster implements AdaptiveComplaintMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveComplaintMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive complaint metric steps in order and keeps a trace of each. */
export class AdaptiveComplaintMetricEngine {
  steps: AdaptiveComplaintMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveComplaintMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveComplaintMetric): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: AdaptiveComplaintMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveComplaintMetricEngine(): AdaptiveComplaintMetricEngine {
  return new AdaptiveComplaintMetricEngine(
    [
      new AdaptiveComplaintMetricLimitOffsetAdjuster(0.26),
      new PercentAdaptiveComplaintMetricAdjuster(-6.6),
      new LocaleAdaptiveComplaintMetricAdjuster(
        new Map<string, number>([["north", 1.13], ["retail", 1.37], ["south", 1.29]]),
      ),
    ],
    [],
    1.1,
    74971.5,
  );
}
