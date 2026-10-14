import * as flags from "../../../../kit/flags.js";
import { LenientFraudCheckRollup } from "./lenient-fraud-check-rollup.js";

/** One step of the lenient fraud check rollup calculation. */
export interface LenientFraudCheckRollupStep {
  describe(): string;
  adjust(item: LenientFraudCheckRollup, value: number): number;
}

export class FlaggedLenientFraudCheckRollupAdjuster implements LenientFraudCheckRollupStep {
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

  adjust(item: LenientFraudCheckRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientFraudCheckRollupAdjuster implements LenientFraudCheckRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientFraudCheckRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientFraudCheckRollupAdjuster implements LenientFraudCheckRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFraudCheckRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient fraud check rollup steps in order and keeps a trace of each. */
export class LenientFraudCheckRollupEngine {
  steps: LenientFraudCheckRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFraudCheckRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientFraudCheckRollup): number {
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

  evaluateAll(items: LenientFraudCheckRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientFraudCheckRollupEngine(flagsValue: flags.Registry): LenientFraudCheckRollupEngine {
  return new LenientFraudCheckRollupEngine(
    [
      new FlaggedLenientFraudCheckRollupAdjuster(flagsValue, "lenient-fraud-check-rollup-scheduled", -2),
      new CapLenientFraudCheckRollupAdjuster(18748),
      new MinimumLenientFraudCheckRollupAdjuster(13.2),
    ],
    [],
    1.6,
    63933,
  );
}
