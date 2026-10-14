import * as numbers from "../../../../kit/numbers.js";
import { ComplaintMetric } from "./complaint-metric.js";

/** One step of the complaint metric calculation. */
export interface ComplaintMetricFactor {
  describe(): string;
  adjust(item: ComplaintMetric, value: number): number;
}

export class ComplaintMetricRateOffsetAdjuster implements ComplaintMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ComplaintMetric, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentComplaintMetricAdjuster implements ComplaintMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitComplaintMetricAdjuster implements ComplaintMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ComplaintMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the complaint metric steps in order and keeps a trace of each. */
export class ComplaintMetricEngine {
  steps: ComplaintMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ComplaintMetric): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ComplaintMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultComplaintMetricEngine(): ComplaintMetricEngine {
  return new ComplaintMetricEngine(
    [
      new ComplaintMetricRateOffsetAdjuster(0.4),
      new PercentComplaintMetricAdjuster(-22),
      new UnitComplaintMetricAdjuster(new Map<string, number>([["central", 1.22]])),
    ],
    [],
    3.8,
    5357.7,
  );
}
