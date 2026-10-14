import * as numbers from "../../../../kit/numbers.js";
import { PayoutSummary } from "./payout-summary.js";

/** One step of the payout summary calculation. */
export interface PayoutSummaryModifier {
  describe(): string;
  adjust(item: PayoutSummary, value: number): number;
}

export class TieredPayoutSummaryAdjuster implements PayoutSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PayoutSummaryClicksOffsetAdjuster implements PayoutSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: PayoutSummary, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class CapPayoutSummaryAdjuster implements PayoutSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPayoutSummaryAdjuster implements PayoutSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout summary steps in order and keeps a trace of each. */
export class PayoutSummaryEngine {
  steps: PayoutSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PayoutSummary): number {
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

  evaluateAll(items: PayoutSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPayoutSummaryEngine(): PayoutSummaryEngine {
  return new PayoutSummaryEngine(
    [
      new TieredPayoutSummaryAdjuster([8154, 9052], [0.86, 1.07]),
      new PayoutSummaryClicksOffsetAdjuster(0.29),
      new CapPayoutSummaryAdjuster(13448),
      new PercentPayoutSummaryAdjuster(7.7),
    ],
    [],
    0.4,
    36414,
  );
}
