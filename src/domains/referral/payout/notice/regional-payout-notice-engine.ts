import { RegionalPayoutNotice } from "./regional-payout-notice.js";

/** One step of the regional payout notice calculation. */
export interface RegionalPayoutNoticeModifier {
  describe(): string;
  adjust(item: RegionalPayoutNotice, value: number): number;
}

export class CapRegionalPayoutNoticeAdjuster implements RegionalPayoutNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPayoutNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalPayoutNoticeAdjuster implements RegionalPayoutNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPayoutNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRegionalPayoutNoticeAdjuster implements RegionalPayoutNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPayoutNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitRegionalPayoutNoticeAdjuster implements RegionalPayoutNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RegionalPayoutNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional payout notice steps in order and keeps a trace of each. */
export class RegionalPayoutNoticeEngine {
  steps: RegionalPayoutNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPayoutNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalPayoutNotice): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RegionalPayoutNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalPayoutNoticeEngine(): RegionalPayoutNoticeEngine {
  return new RegionalPayoutNoticeEngine(
    [
      new CapRegionalPayoutNoticeAdjuster(16794),
      new TieredRegionalPayoutNoticeAdjuster([5616, 5622], [0.91, 1.06]),
      new PercentRegionalPayoutNoticeAdjuster(-21.4),
      new UnitRegionalPayoutNoticeAdjuster(new Map<string, number>([["east", 0.86]])),
    ],
    [],
    4.7,
    87828.4,
  );
}
