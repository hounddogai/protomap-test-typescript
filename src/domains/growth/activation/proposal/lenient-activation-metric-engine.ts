import * as numbers from "../../../../kit/numbers.js";
import { LenientActivationMetric } from "./lenient-activation-metric.js";

/** One step of the lenient activation metric calculation. */
export interface LenientActivationMetricModifier {
  describe(): string;
  adjust(item: LenientActivationMetric, value: number): number;
}

export class PercentLenientActivationMetricAdjuster implements LenientActivationMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientActivationMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LenientActivationMetricRateOffsetAdjuster implements LenientActivationMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LenientActivationMetric, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredLenientActivationMetricAdjuster implements LenientActivationMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientActivationMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient activation metric steps in order and keeps a trace of each. */
export class LenientActivationMetricEngine {
  steps: LenientActivationMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientActivationMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientActivationMetric): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LenientActivationMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientActivationMetricEngine(): LenientActivationMetricEngine {
  return new LenientActivationMetricEngine(
    [
      new PercentLenientActivationMetricAdjuster(-22.5),
      new LenientActivationMetricRateOffsetAdjuster(0.81),
      new TieredLenientActivationMetricAdjuster([1535, 2405, 4124, 4344], [1.1, 0.95, 1.03, 1.13]),
    ],
    [],
    2.2,
    89551.6,
  );
}
