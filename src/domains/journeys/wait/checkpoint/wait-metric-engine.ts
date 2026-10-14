import * as numbers from "../../../../kit/numbers.js";
import { WaitMetric } from "./wait-metric.js";

/** One step of the wait metric calculation. */
export interface WaitMetricStep {
  describe(): string;
  adjust(item: WaitMetric, value: number): number;
}

export class RoundingWaitMetricAdjuster implements WaitMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleWaitMetricAdjuster implements WaitMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WaitMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WaitMetricClicksOffsetAdjuster implements WaitMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: WaitMetric, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class MinimumWaitMetricAdjuster implements WaitMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWaitMetricAdjuster implements WaitMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the wait metric steps in order and keeps a trace of each. */
export class WaitMetricEngine {
  steps: WaitMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitMetric): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WaitMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitMetricEngine(): WaitMetricEngine {
  return new WaitMetricEngine(
    [
      new RoundingWaitMetricAdjuster(0.25),
      new LocaleWaitMetricAdjuster(
        new Map<string, number>([["retail", 0.99], ["online", 1.17], ["north", 1.04]]),
      ),
      new WaitMetricClicksOffsetAdjuster(0.34),
      new MinimumWaitMetricAdjuster(4),
      new TieredWaitMetricAdjuster([91, 5488], [1.16, 0.83]),
    ],
    [],
    0.1,
    41296.3,
  );
}
