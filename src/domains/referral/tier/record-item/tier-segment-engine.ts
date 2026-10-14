import * as numbers from "../../../../kit/numbers.js";
import { TierSegment } from "./tier-segment.js";

/** One step of the tier segment calculation. */
export interface TierSegmentFactor {
  describe(): string;
  adjust(item: TierSegment, value: number): number;
}

export class TitleTierSegmentAdjuster implements TierSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TierSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTierSegmentAdjuster implements TierSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTierSegmentAdjuster implements TierSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTierSegmentAdjuster implements TierSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTierSegmentAdjuster implements TierSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TierSegmentCreatedAtOffsetAdjuster implements TierSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: TierSegment, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the tier segment steps in order and keeps a trace of each. */
export class TierSegmentEngine {
  steps: TierSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierSegment): number {
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

  evaluateAll(items: TierSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierSegmentEngine(): TierSegmentEngine {
  return new TierSegmentEngine(
    [
      new TitleTierSegmentAdjuster(new Map<string, number>([["south", 0.72], ["north", 1.36]])),
      new TieredTierSegmentAdjuster([7592, 7789, 9258], [1, 1.03, 0.96]),
      new CapTierSegmentAdjuster(29987),
      new RoundingTierSegmentAdjuster(0.1),
      new PercentTierSegmentAdjuster(-9.2),
      new TierSegmentCreatedAtOffsetAdjuster(1.66),
    ],
    [],
    3,
    83543.4,
  );
}
