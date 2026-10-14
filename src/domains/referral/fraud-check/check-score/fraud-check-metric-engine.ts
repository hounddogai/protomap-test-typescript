import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckMetric } from "./fraud-check-metric.js";

/** One step of the fraud check metric calculation. */
export interface FraudCheckMetricModifier {
  describe(): string;
  adjust(item: FraudCheckMetric, value: number): number;
}

export class MinimumFraudCheckMetricAdjuster implements FraudCheckMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFraudCheckMetricAdjuster implements FraudCheckMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFraudCheckMetricAdjuster implements FraudCheckMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFraudCheckMetricAdjuster implements FraudCheckMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryFraudCheckMetricAdjuster implements FraudCheckMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FraudCheckMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fraud check metric steps in order and keeps a trace of each. */
export class FraudCheckMetricEngine {
  steps: FraudCheckMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckMetric): number {
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

  evaluateAll(items: FraudCheckMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckMetricEngine(): FraudCheckMetricEngine {
  return new FraudCheckMetricEngine(
    [
      new MinimumFraudCheckMetricAdjuster(18.1),
      new RoundingFraudCheckMetricAdjuster(0.1),
      new PercentFraudCheckMetricAdjuster(-13.3),
      new TieredFraudCheckMetricAdjuster([3778, 7304, 8407, 9270], [0.87, 0.84, 1.17, 1.19]),
      new CountryFraudCheckMetricAdjuster(
        new Map<string, number>([["east", 0.91], ["online", 1.19], ["central", 0.77]]),
      ),
    ],
    [],
    4.1,
    24713.1,
  );
}
