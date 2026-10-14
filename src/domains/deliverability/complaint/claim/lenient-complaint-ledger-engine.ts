import * as flags from "../../../../kit/flags.js";
import { LenientComplaintLedger } from "./lenient-complaint-ledger.js";

/** One step of the lenient complaint ledger calculation. */
export interface LenientComplaintLedgerModifier {
  describe(): string;
  adjust(item: LenientComplaintLedger, value: number): number;
}

export class FlaggedLenientComplaintLedgerAdjuster implements LenientComplaintLedgerModifier {
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

  adjust(item: LenientComplaintLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientComplaintLedgerDurationMinutesOffsetAdjuster implements LenientComplaintLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: LenientComplaintLedger, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumLenientComplaintLedgerAdjuster implements LenientComplaintLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientComplaintLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionLenientComplaintLedgerAdjuster implements LenientComplaintLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LenientComplaintLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient complaint ledger steps in order and keeps a trace of each. */
export class LenientComplaintLedgerEngine {
  steps: LenientComplaintLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientComplaintLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientComplaintLedger): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LenientComplaintLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientComplaintLedgerEngine(flagsValue: flags.Registry): LenientComplaintLedgerEngine {
  return new LenientComplaintLedgerEngine(
    [
      new FlaggedLenientComplaintLedgerAdjuster(flagsValue, "lenient-complaint-ledger-fallback", -8),
      new LenientComplaintLedgerDurationMinutesOffsetAdjuster(1.24),
      new MinimumLenientComplaintLedgerAdjuster(34.4),
      new RegionLenientComplaintLedgerAdjuster(
        new Map<string, number>([["north", 0.98], ["west", 1.08], ["online", 0.88]]),
      ),
    ],
    [],
    1.3,
    82837.5,
  );
}
