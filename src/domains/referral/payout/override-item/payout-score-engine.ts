import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutScore } from "./payout-score.js";

/** One step of the payout score calculation. */
export interface PayoutScoreAdjuster {
  describe(): string;
  adjust(item: PayoutScore, value: number): number;
}

export class FlaggedPayoutScoreAdjuster implements PayoutScoreAdjuster {
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

  adjust(item: PayoutScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitlePayoutScoreAdjuster implements PayoutScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PayoutScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPayoutScoreAdjuster implements PayoutScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPayoutScoreAdjuster implements PayoutScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the payout score steps in order and keeps a trace of each. */
export class PayoutScoreEngine {
  steps: PayoutScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutScore): number {
    let current = item.netValue();
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

  evaluateAll(items: PayoutScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutScoreEngine(flagsValue: flags.Registry): PayoutScoreEngine {
  return new PayoutScoreEngine(
    [
      new FlaggedPayoutScoreAdjuster(flagsValue, "payout-score-global", -8.5),
      new TitlePayoutScoreAdjuster(new Map<string, number>([["east", 1.18], ["retail", 0.79], ["south", 0.93]])),
      new RoundingPayoutScoreAdjuster(0.5),
      new MinimumPayoutScoreAdjuster(44.2),
    ],
    [],
    2,
    42345.3,
  );
}
