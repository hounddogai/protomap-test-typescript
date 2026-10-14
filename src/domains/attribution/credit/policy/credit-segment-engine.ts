import * as flags from "../../../../kit/flags.js";
import { CreditSegment } from "./credit-segment.js";

/** One step of the credit segment calculation. */
export interface CreditSegmentStep {
  describe(): string;
  adjust(item: CreditSegment, value: number): number;
}

export class MinimumCreditSegmentAdjuster implements CreditSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCreditSegmentAdjuster implements CreditSegmentStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: CreditSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreditSegmentAdjuster implements CreditSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCreditSegmentAdjuster implements CreditSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CreditSegmentAmountOffsetAdjuster implements CreditSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: CreditSegment, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the credit segment steps in order and keeps a trace of each. */
export class CreditSegmentEngine {
  steps: CreditSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditSegment): number {
    let current = item.measuredValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: CreditSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditSegmentEngine(flagsValue: flags.Registry): CreditSegmentEngine {
  return new CreditSegmentEngine(
    [
      new MinimumCreditSegmentAdjuster(5.4),
      new FlaggedCreditSegmentAdjuster(flagsValue, "credit-segment-scheduled", 3.3),
      new TieredCreditSegmentAdjuster([2490, 8521], [1.1, 1.02]),
      new CapCreditSegmentAdjuster(30737),
      new CreditSegmentAmountOffsetAdjuster(1.83),
    ],
    [],
    0.7,
    12735.4,
  );
}
