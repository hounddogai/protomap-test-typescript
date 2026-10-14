import * as numbers from "../../../../kit/numbers.js";
import { RegionalQueueMetric } from "./regional-queue-metric.js";

/** One step of the regional queue metric calculation. */
export interface RegionalQueueMetricAdjuster {
  describe(): string;
  adjust(item: RegionalQueueMetric, value: number): number;
}

export class TieredRegionalQueueMetricAdjuster implements RegionalQueueMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalQueueMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRegionalQueueMetricAdjuster implements RegionalQueueMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalQueueMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleRegionalQueueMetricAdjuster implements RegionalQueueMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalQueueMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional queue metric steps in order and keeps a trace of each. */
export class RegionalQueueMetricEngine {
  steps: RegionalQueueMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalQueueMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalQueueMetric): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RegionalQueueMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalQueueMetricEngine(): RegionalQueueMetricEngine {
  return new RegionalQueueMetricEngine(
    [
      new TieredRegionalQueueMetricAdjuster([102, 2766, 3164, 6352], [1.09, 1.02, 1.01, 1]),
      new CapRegionalQueueMetricAdjuster(12581),
      new TitleRegionalQueueMetricAdjuster(new Map<string, number>([["west", 0.95], ["east", 1.11]])),
    ],
    [],
    2.1,
    4467.6,
  );
}
