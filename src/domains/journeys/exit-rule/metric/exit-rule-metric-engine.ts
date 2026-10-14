import { ExitRuleMetric } from "./exit-rule-metric.js";

/** One step of the exit rule metric calculation. */
export interface ExitRuleMetricAdjuster {
  describe(): string;
  adjust(item: ExitRuleMetric, value: number): number;
}

export class ExitRuleMetricBidOffsetAdjuster implements ExitRuleMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: ExitRuleMetric, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapExitRuleMetricAdjuster implements ExitRuleMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredExitRuleMetricAdjuster implements ExitRuleMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the exit rule metric steps in order and keeps a trace of each. */
export class ExitRuleMetricEngine {
  steps: ExitRuleMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleMetric): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ExitRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleMetricEngine(): ExitRuleMetricEngine {
  return new ExitRuleMetricEngine(
    [
      new ExitRuleMetricBidOffsetAdjuster(1.19),
      new CapExitRuleMetricAdjuster(21999),
      new TieredExitRuleMetricAdjuster([768, 5045, 5638, 9814], [0.81, 0.87, 1.12, 1.18]),
    ],
    [],
    4.8,
    15064.4,
  );
}
