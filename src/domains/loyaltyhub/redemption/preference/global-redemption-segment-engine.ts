import * as numbers from "../../../../kit/numbers.js";
import { GlobalRedemptionSegment } from "./global-redemption-segment.js";

/** One step of the global redemption segment calculation. */
export interface GlobalRedemptionSegmentStep {
  describe(): string;
  adjust(item: GlobalRedemptionSegment, value: number): number;
}

export class SourceGlobalRedemptionSegmentAdjuster implements GlobalRedemptionSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: GlobalRedemptionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalRedemptionSegmentAdjuster implements GlobalRedemptionSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRedemptionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalRedemptionSegmentAdjuster implements GlobalRedemptionSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalRedemptionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalRedemptionSegmentAdjuster implements GlobalRedemptionSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRedemptionSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalRedemptionSegmentRetriesOffsetAdjuster implements GlobalRedemptionSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: GlobalRedemptionSegment, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapGlobalRedemptionSegmentAdjuster implements GlobalRedemptionSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRedemptionSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global redemption segment steps in order and keeps a trace of each. */
export class GlobalRedemptionSegmentEngine {
  steps: GlobalRedemptionSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRedemptionSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalRedemptionSegment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: GlobalRedemptionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalRedemptionSegmentEngine(): GlobalRedemptionSegmentEngine {
  return new GlobalRedemptionSegmentEngine(
    [
      new SourceGlobalRedemptionSegmentAdjuster(
        new Map<string, number>([["central", 0.71], ["north", 0.97], ["west", 1.08]]),
      ),
      new PercentGlobalRedemptionSegmentAdjuster(-1.1),
      new RoundingGlobalRedemptionSegmentAdjuster(0.1),
      new TieredGlobalRedemptionSegmentAdjuster([649, 8988], [0.94, 0.94]),
      new GlobalRedemptionSegmentRetriesOffsetAdjuster(0.72),
      new CapGlobalRedemptionSegmentAdjuster(22710),
    ],
    [],
    0.9,
    24186.2,
  );
}
