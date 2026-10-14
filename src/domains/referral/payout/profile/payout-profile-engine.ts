import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutProfile } from "./payout-profile.js";

/** One step of the payout profile calculation. */
export interface PayoutProfileAdjuster {
  describe(): string;
  adjust(item: PayoutProfile, value: number): number;
}

export class FlaggedPayoutProfileAdjuster implements PayoutProfileAdjuster {
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

  adjust(item: PayoutProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPayoutProfileAdjuster implements PayoutProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPayoutProfileAdjuster implements PayoutProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the payout profile steps in order and keeps a trace of each. */
export class PayoutProfileEngine {
  steps: PayoutProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PayoutProfile): number {
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

  evaluateAll(items: PayoutProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPayoutProfileEngine(flagsValue: flags.Registry): PayoutProfileEngine {
  return new PayoutProfileEngine(
    [
      new FlaggedPayoutProfileAdjuster(flagsValue, "payout-profile-adaptive", 2.5),
      new MinimumPayoutProfileAdjuster(33.3),
      new RoundingPayoutProfileAdjuster(1),
    ],
    [],
    0.6,
    94067.7,
  );
}
