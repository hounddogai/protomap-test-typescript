import { ScheduledPayoutScore } from "./scheduled-payout-score.js";

/** One step of the scheduled payout score calculation. */
export interface ScheduledPayoutScoreAdjuster {
  describe(): string;
  adjust(item: ScheduledPayoutScore, value: number): number;
}

export class TieredScheduledPayoutScoreAdjuster implements ScheduledPayoutScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledPayoutScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelScheduledPayoutScoreAdjuster implements ScheduledPayoutScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ScheduledPayoutScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledPayoutScoreAdjuster implements ScheduledPayoutScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledPayoutScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled payout score steps in order and keeps a trace of each. */
export class ScheduledPayoutScoreEngine {
  steps: ScheduledPayoutScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPayoutScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledPayoutScore): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ScheduledPayoutScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledPayoutScoreEngine(): ScheduledPayoutScoreEngine {
  return new ScheduledPayoutScoreEngine(
    [
      new TieredScheduledPayoutScoreAdjuster([1715, 8583, 8761, 8801], [0.97, 0.86, 1.11, 1.18]),
      new ChannelScheduledPayoutScoreAdjuster(new Map<string, number>([["west", 0.92], ["online", 1.4]])),
      new MinimumScheduledPayoutScoreAdjuster(29.7),
    ],
    [],
    1.4,
    8023.7,
  );
}
