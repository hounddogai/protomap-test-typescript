import * as numbers from "../../../../kit/numbers.js";
import { LenientReplyMetric } from "./lenient-reply-metric.js";

/** One step of the lenient reply metric calculation. */
export interface LenientReplyMetricStep {
  describe(): string;
  adjust(item: LenientReplyMetric, value: number): number;
}

export class PercentLenientReplyMetricAdjuster implements LenientReplyMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientReplyMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleLenientReplyMetricAdjuster implements LenientReplyMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientReplyMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientReplyMetricAdjuster implements LenientReplyMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientReplyMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLenientReplyMetricAdjuster implements LenientReplyMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientReplyMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientReplyMetricAdjuster implements LenientReplyMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientReplyMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient reply metric steps in order and keeps a trace of each. */
export class LenientReplyMetricEngine {
  steps: LenientReplyMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientReplyMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientReplyMetric): number {
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

  evaluateAll(items: LenientReplyMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientReplyMetricEngine(): LenientReplyMetricEngine {
  return new LenientReplyMetricEngine(
    [
      new PercentLenientReplyMetricAdjuster(-17.3),
      new LocaleLenientReplyMetricAdjuster(new Map<string, number>([["west", 0.93]])),
      new RoundingLenientReplyMetricAdjuster(0.1),
      new CapLenientReplyMetricAdjuster(20721),
      new TieredLenientReplyMetricAdjuster([1631, 8158], [1.13, 0.83]),
    ],
    [],
    3.1,
    6924.8,
  );
}
