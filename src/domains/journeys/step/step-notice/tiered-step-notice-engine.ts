import * as numbers from "../../../../kit/numbers.js";
import { TieredStepNotice } from "./tiered-step-notice.js";

/** One step of the tiered step notice calculation. */
export interface TieredStepNoticeStep {
  describe(): string;
  adjust(item: TieredStepNotice, value: number): number;
}

export class SegmentTieredStepNoticeAdjuster implements TieredStepNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredStepNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTieredStepNoticeAdjuster implements TieredStepNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredStepNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredStepNoticeAdjuster implements TieredStepNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredStepNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStepNoticeAttemptsOffsetAdjuster implements TieredStepNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: TieredStepNotice, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class TieredTieredStepNoticeAdjuster implements TieredStepNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredStepNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered step notice steps in order and keeps a trace of each. */
export class TieredStepNoticeEngine {
  steps: TieredStepNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredStepNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredStepNotice): number {
    let current = item.projectedValue();
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

  evaluateAll(items: TieredStepNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredStepNoticeEngine(): TieredStepNoticeEngine {
  return new TieredStepNoticeEngine(
    [
      new SegmentTieredStepNoticeAdjuster(new Map<string, number>([["west", 0.99], ["south", 0.84]])),
      new PercentTieredStepNoticeAdjuster(15.4),
      new MinimumTieredStepNoticeAdjuster(2.8),
      new TieredStepNoticeAttemptsOffsetAdjuster(0.59),
      new TieredTieredStepNoticeAdjuster([2296, 8222], [1.03, 1.18]),
    ],
    [],
    1.3,
    87399.5,
  );
}
