import * as flags from "../../../../kit/flags.js";
import { BatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

/** One step of the batched leaderboard agreement calculation. */
export interface BatchedLeaderboardAgreementStep {
  describe(): string;
  adjust(item: BatchedLeaderboardAgreement, value: number): number;
}

export class CapBatchedLeaderboardAgreementAdjuster implements BatchedLeaderboardAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedLeaderboardAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBatchedLeaderboardAgreementAdjuster implements BatchedLeaderboardAgreementStep {
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

  adjust(item: BatchedLeaderboardAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedLeaderboardAgreementDiscountOffsetAdjuster implements BatchedLeaderboardAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: BatchedLeaderboardAgreement, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the batched leaderboard agreement steps in order and keeps a trace of each. */
export class BatchedLeaderboardAgreementEngine {
  steps: BatchedLeaderboardAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedLeaderboardAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedLeaderboardAgreement): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BatchedLeaderboardAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedLeaderboardAgreementEngine(flagsValue: flags.Registry): BatchedLeaderboardAgreementEngine {
  return new BatchedLeaderboardAgreementEngine(
    [
      new CapBatchedLeaderboardAgreementAdjuster(2846),
      new FlaggedBatchedLeaderboardAgreementAdjuster(flagsValue, "batched-leaderboard-agreement-primary", -0.5),
      new BatchedLeaderboardAgreementDiscountOffsetAdjuster(0.14),
    ],
    [],
    3,
    22552.5,
  );
}
