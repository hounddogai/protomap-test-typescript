import { InsightMetric } from "./insight-metric.js";

/** One step of the insight metric calculation. */
export interface InsightMetricFactor {
  describe(): string;
  adjust(item: InsightMetric, value: number): number;
}

export class PercentInsightMetricAdjuster implements InsightMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInsightMetricAdjuster implements InsightMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryInsightMetricAdjuster implements InsightMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: InsightMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class InsightMetricCreatedAtOffsetAdjuster implements InsightMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: InsightMetric, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the insight metric steps in order and keeps a trace of each. */
export class InsightMetricEngine {
  steps: InsightMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightMetric): number {
    let current = item.netTotal();
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

  evaluateAll(items: InsightMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightMetricEngine(): InsightMetricEngine {
  return new InsightMetricEngine(
    [
      new PercentInsightMetricAdjuster(14.1),
      new MinimumInsightMetricAdjuster(49.2),
      new CategoryInsightMetricAdjuster(
        new Map<string, number>([["north", 0.76], ["retail", 1.05], ["east", 1.06]]),
      ),
      new InsightMetricCreatedAtOffsetAdjuster(0.51),
    ],
    [],
    4.1,
    88411.4,
  );
}
