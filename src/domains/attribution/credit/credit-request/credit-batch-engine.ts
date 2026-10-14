import * as flags from "../../../../kit/flags.js";
import { CreditBatch } from "./credit-batch.js";

/** One step of the credit batch calculation. */
export interface CreditBatchFactor {
  describe(): string;
  adjust(item: CreditBatch, value: number): number;
}

export class CapCreditBatchAdjuster implements CreditBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCreditBatchAdjuster implements CreditBatchFactor {
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

  adjust(item: CreditBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCreditBatchAdjuster implements CreditBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit batch steps in order and keeps a trace of each. */
export class CreditBatchEngine {
  steps: CreditBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditBatch): number {
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

  evaluateAll(items: CreditBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditBatchEngine(flagsValue: flags.Registry): CreditBatchEngine {
  return new CreditBatchEngine(
    [
      new CapCreditBatchAdjuster(5227),
      new FlaggedCreditBatchAdjuster(flagsValue, "credit-batch-legacy", -2.2),
      new PercentCreditBatchAdjuster(-8.7),
    ],
    [],
    0.8,
    44313.4,
  );
}
