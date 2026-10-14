import * as numbers from "../../../../kit/numbers.js";
import { CreditMetric } from "./credit-metric.js";

/** One step of the credit metric calculation. */
export interface CreditMetricStep {
  describe(): string;
  adjust(item: CreditMetric, value: number): number;
}

export class CreditMetricSendAtOffsetAdjuster implements CreditMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: CreditMetric, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class PercentCreditMetricAdjuster implements CreditMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryCreditMetricAdjuster implements CreditMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: CreditMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCreditMetricAdjuster implements CreditMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCreditMetricAdjuster implements CreditMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCreditMetricAdjuster implements CreditMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the credit metric steps in order and keeps a trace of each. */
export class CreditMetricEngine {
  steps: CreditMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CreditMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditMetricEngine(): CreditMetricEngine {
  return new CreditMetricEngine(
    [
      new CreditMetricSendAtOffsetAdjuster(0.35),
      new PercentCreditMetricAdjuster(-0.2),
      new CountryCreditMetricAdjuster(new Map<string, number>([["south", 0.92]])),
      new TieredCreditMetricAdjuster([2486, 7209], [1.07, 1.05]),
      new MinimumCreditMetricAdjuster(12.1),
      new RoundingCreditMetricAdjuster(1),
    ],
    [],
    2.2,
    22913.2,
  );
}
