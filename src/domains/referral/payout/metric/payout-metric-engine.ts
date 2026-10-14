import * as numbers from "../../../../kit/numbers.js";
import { PayoutMetric } from "./payout-metric.js";

/** One step of the payout metric calculation. */
export interface PayoutMetricAdjuster {
  describe(): string;
  adjust(item: PayoutMetric, value: number): number;
}

export class MinimumPayoutMetricAdjuster implements PayoutMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PayoutMetricGraceDaysOffsetAdjuster implements PayoutMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PayoutMetric, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class RoundingPayoutMetricAdjuster implements PayoutMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPayoutMetricAdjuster implements PayoutMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout metric steps in order and keeps a trace of each. */
export class PayoutMetricEngine {
  steps: PayoutMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PayoutMetric): number {
    let current = item.netExposure();
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

  evaluateAll(items: PayoutMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPayoutMetricEngine(): PayoutMetricEngine {
  return new PayoutMetricEngine(
    [
      new MinimumPayoutMetricAdjuster(28.3),
      new PayoutMetricGraceDaysOffsetAdjuster(0.92),
      new RoundingPayoutMetricAdjuster(0.25),
      new PercentPayoutMetricAdjuster(-1.7),
    ],
    [],
    0.3,
    29318.7,
  );
}
