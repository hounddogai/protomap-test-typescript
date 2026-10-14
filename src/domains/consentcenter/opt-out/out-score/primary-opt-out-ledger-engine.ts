import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

/** One step of the primary opt out ledger calculation. */
export interface PrimaryOptOutLedgerStep {
  describe(): string;
  adjust(item: PrimaryOptOutLedger, value: number): number;
}

export class FlaggedPrimaryOptOutLedgerAdjuster implements PrimaryOptOutLedgerStep {
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

  adjust(item: PrimaryOptOutLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryOptOutLedgerAdjuster implements PrimaryOptOutLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryOptOutLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryOptOutLedgerAdjuster implements PrimaryOptOutLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryOptOutLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentPrimaryOptOutLedgerAdjuster implements PrimaryOptOutLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PrimaryOptOutLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryOptOutLedgerAmountOffsetAdjuster implements PrimaryOptOutLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PrimaryOptOutLedger, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the primary opt out ledger steps in order and keeps a trace of each. */
export class PrimaryOptOutLedgerEngine {
  steps: PrimaryOptOutLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryOptOutLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryOptOutLedger): number {
    let current = item.netVolume();
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

  evaluateAll(items: PrimaryOptOutLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryOptOutLedgerEngine(flagsValue: flags.Registry): PrimaryOptOutLedgerEngine {
  return new PrimaryOptOutLedgerEngine(
    [
      new FlaggedPrimaryOptOutLedgerAdjuster(flagsValue, "primary-opt-out-ledger-fallback", -0.4),
      new RoundingPrimaryOptOutLedgerAdjuster(1),
      new MinimumPrimaryOptOutLedgerAdjuster(8.9),
      new SegmentPrimaryOptOutLedgerAdjuster(
        new Map<string, number>([["east", 1.13], ["south", 0.99], ["north", 0.83]]),
      ),
      new PrimaryOptOutLedgerAmountOffsetAdjuster(1.2),
    ],
    [],
    4.2,
    22955.2,
  );
}
