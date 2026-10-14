import * as numbers from "../../../../kit/numbers.js";
import { PendingBidRuleSegment } from "./pending-bid-rule-segment.js";

/** One step of the pending bid rule segment calculation. */
export interface PendingBidRuleSegmentFactor {
  describe(): string;
  adjust(item: PendingBidRuleSegment, value: number): number;
}

export class TieredPendingBidRuleSegmentAdjuster implements PendingBidRuleSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBidRuleSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingBidRuleSegmentAdjuster implements PendingBidRuleSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBidRuleSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingBidRuleSegmentAdjuster implements PendingBidRuleSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBidRuleSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingBidRuleSegmentAdjuster implements PendingBidRuleSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBidRuleSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelPendingBidRuleSegmentAdjuster implements PendingBidRuleSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingBidRuleSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingBidRuleSegmentAdjuster implements PendingBidRuleSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBidRuleSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending bid rule segment steps in order and keeps a trace of each. */
export class PendingBidRuleSegmentEngine {
  steps: PendingBidRuleSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRuleSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBidRuleSegment): number {
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

  evaluateAll(items: PendingBidRuleSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBidRuleSegmentEngine(): PendingBidRuleSegmentEngine {
  return new PendingBidRuleSegmentEngine(
    [
      new TieredPendingBidRuleSegmentAdjuster([1953, 5275, 6902], [0.88, 1.08, 0.86]),
      new CapPendingBidRuleSegmentAdjuster(2355),
      new PercentPendingBidRuleSegmentAdjuster(20.6),
      new RoundingPendingBidRuleSegmentAdjuster(0.5),
      new ChannelPendingBidRuleSegmentAdjuster(new Map<string, number>([["online", 1.09], ["retail", 1.2]])),
      new MinimumPendingBidRuleSegmentAdjuster(5),
    ],
    [],
    0.5,
    13738.1,
  );
}
