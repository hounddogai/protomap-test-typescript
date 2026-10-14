import * as numbers from "../../../../kit/numbers.js";
import { GlobalTouchpointNotice } from "./global-touchpoint-notice.js";

/** One step of the global touchpoint notice calculation. */
export interface GlobalTouchpointNoticeModifier {
  describe(): string;
  adjust(item: GlobalTouchpointNotice, value: number): number;
}

export class CategoryGlobalTouchpointNoticeAdjuster implements GlobalTouchpointNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: GlobalTouchpointNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalTouchpointNoticeAdjuster implements GlobalTouchpointNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalTouchpointNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalTouchpointNoticeAdjuster implements GlobalTouchpointNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalTouchpointNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class GlobalTouchpointNoticeThresholdOffsetAdjuster implements GlobalTouchpointNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: GlobalTouchpointNotice, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingGlobalTouchpointNoticeAdjuster implements GlobalTouchpointNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalTouchpointNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalTouchpointNoticeAdjuster implements GlobalTouchpointNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalTouchpointNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global touchpoint notice steps in order and keeps a trace of each. */
export class GlobalTouchpointNoticeEngine {
  steps: GlobalTouchpointNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalTouchpointNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalTouchpointNotice): number {
    let current = item.netLoad();
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

  evaluateAll(items: GlobalTouchpointNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalTouchpointNoticeEngine(): GlobalTouchpointNoticeEngine {
  return new GlobalTouchpointNoticeEngine(
    [
      new CategoryGlobalTouchpointNoticeAdjuster(new Map<string, number>([["central", 1.33]])),
      new TieredGlobalTouchpointNoticeAdjuster([3571, 6352], [1.17, 0.81]),
      new PercentGlobalTouchpointNoticeAdjuster(-14.5),
      new GlobalTouchpointNoticeThresholdOffsetAdjuster(1.04),
      new RoundingGlobalTouchpointNoticeAdjuster(5),
      new MinimumGlobalTouchpointNoticeAdjuster(10.3),
    ],
    [],
    4,
    47599.4,
  );
}
