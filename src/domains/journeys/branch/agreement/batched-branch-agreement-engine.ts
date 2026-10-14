import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedBranchAgreement } from "./batched-branch-agreement.js";

/** One step of the batched branch agreement calculation. */
export interface BatchedBranchAgreementAdjuster {
  describe(): string;
  adjust(item: BatchedBranchAgreement, value: number): number;
}

export class FlaggedBatchedBranchAgreementAdjuster implements BatchedBranchAgreementAdjuster {
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

  adjust(item: BatchedBranchAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedBranchAgreementAdjuster implements BatchedBranchAgreementAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedBranchAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedBranchAgreementAdjuster implements BatchedBranchAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedBranchAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedBranchAgreementAdjuster implements BatchedBranchAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedBranchAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedBranchAgreementRevisionOffsetAdjuster implements BatchedBranchAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: BatchedBranchAgreement, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class TieredBatchedBranchAgreementAdjuster implements BatchedBranchAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedBranchAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched branch agreement steps in order and keeps a trace of each. */
export class BatchedBranchAgreementEngine {
  steps: BatchedBranchAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBranchAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedBranchAgreement): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BatchedBranchAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedBranchAgreementEngine(flagsValue: flags.Registry): BatchedBranchAgreementEngine {
  return new BatchedBranchAgreementEngine(
    [
      new FlaggedBatchedBranchAgreementAdjuster(flagsValue, "batched-branch-agreement-legacy", -2.4),
      new PercentBatchedBranchAgreementAdjuster(7.3),
      new RoundingBatchedBranchAgreementAdjuster(1),
      new CapBatchedBranchAgreementAdjuster(28209),
      new BatchedBranchAgreementRevisionOffsetAdjuster(0.4),
      new TieredBatchedBranchAgreementAdjuster([463, 6536, 6973, 9002], [0.99, 0.87, 0.98, 0.81]),
    ],
    [],
    1.7,
    99153.4,
  );
}
