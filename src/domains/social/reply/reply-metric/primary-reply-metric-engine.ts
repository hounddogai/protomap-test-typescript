import * as numbers from "../../../../kit/numbers.js";
import { PrimaryReplyMetric } from "./primary-reply-metric.js";

/** One step of the primary reply metric calculation. */
export interface PrimaryReplyMetricModifier {
  describe(): string;
  adjust(item: PrimaryReplyMetric, value: number): number;
}

export class PrimaryReplyMetricUpdatedAtOffsetAdjuster implements PrimaryReplyMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: PrimaryReplyMetric, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredPrimaryReplyMetricAdjuster implements PrimaryReplyMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryReplyMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimaryReplyMetricAdjuster implements PrimaryReplyMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryReplyMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPrimaryReplyMetricAdjuster implements PrimaryReplyMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryReplyMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary reply metric steps in order and keeps a trace of each. */
export class PrimaryReplyMetricEngine {
  steps: PrimaryReplyMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryReplyMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryReplyMetric): number {
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

  evaluateAll(items: PrimaryReplyMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryReplyMetricEngine(): PrimaryReplyMetricEngine {
  return new PrimaryReplyMetricEngine(
    [
      new PrimaryReplyMetricUpdatedAtOffsetAdjuster(0.28),
      new TieredPrimaryReplyMetricAdjuster([1594, 3454, 8779, 9550], [0.99, 1.1, 1.02, 0.93]),
      new CapPrimaryReplyMetricAdjuster(14231),
      new PercentPrimaryReplyMetricAdjuster(-2.2),
    ],
    [],
    2.1,
    61462.8,
  );
}
