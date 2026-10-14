import * as numbers from "../../../../kit/numbers.js";
import { LenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

/** One step of the lenient bid rule metric calculation. */
export interface LenientBidRuleMetricModifier {
  describe(): string;
  adjust(item: LenientBidRuleMetric, value: number): number;
}

export class CapLenientBidRuleMetricAdjuster implements LenientBidRuleMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientBidRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientBidRuleMetricAdjuster implements LenientBidRuleMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientBidRuleMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLenientBidRuleMetricAdjuster implements LenientBidRuleMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientBidRuleMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient bid rule metric steps in order and keeps a trace of each. */
export class LenientBidRuleMetricEngine {
  steps: LenientBidRuleMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBidRuleMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientBidRuleMetric): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LenientBidRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientBidRuleMetricEngine(): LenientBidRuleMetricEngine {
  return new LenientBidRuleMetricEngine(
    [
      new CapLenientBidRuleMetricAdjuster(2314),
      new RoundingLenientBidRuleMetricAdjuster(0.5),
      new TieredLenientBidRuleMetricAdjuster([654, 922, 7441], [1.08, 0.86, 0.91]),
    ],
    [],
    1.5,
    7825.8,
  );
}
