import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutDraft } from "./payout-draft.js";

/** One step of the payout draft calculation. */
export interface PayoutDraftAdjuster {
  describe(): string;
  adjust(item: PayoutDraft, value: number): number;
}

export class FlaggedPayoutDraftAdjuster implements PayoutDraftAdjuster {
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

  adjust(item: PayoutDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PayoutDraftAmountOffsetAdjuster implements PayoutDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PayoutDraft, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class TieredPayoutDraftAdjuster implements PayoutDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPayoutDraftAdjuster implements PayoutDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the payout draft steps in order and keeps a trace of each. */
export class PayoutDraftEngine {
  steps: PayoutDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PayoutDraft): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PayoutDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPayoutDraftEngine(flagsValue: flags.Registry): PayoutDraftEngine {
  return new PayoutDraftEngine(
    [
      new FlaggedPayoutDraftAdjuster(flagsValue, "payout-draft-batched", -6),
      new PayoutDraftAmountOffsetAdjuster(0.52),
      new TieredPayoutDraftAdjuster([1358, 4598, 5898], [0.96, 0.91, 1.14]),
      new RoundingPayoutDraftAdjuster(0.05),
    ],
    [],
    1.4,
    80913.3,
  );
}
