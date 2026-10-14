import * as flags from "../../../../kit/flags.js";
import { BatchedStepProposal } from "./batched-step-proposal.js";

/** One step of the batched step proposal calculation. */
export interface BatchedStepProposalStep {
  describe(): string;
  adjust(item: BatchedStepProposal, value: number): number;
}

export class BatchedStepProposalMarginOffsetAdjuster implements BatchedStepProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: BatchedStepProposal, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedBatchedStepProposalAdjuster implements BatchedStepProposalStep {
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

  adjust(item: BatchedStepProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryBatchedStepProposalAdjuster implements BatchedStepProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedStepProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedStepProposalAdjuster implements BatchedStepProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedStepProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched step proposal steps in order and keeps a trace of each. */
export class BatchedStepProposalEngine {
  steps: BatchedStepProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedStepProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedStepProposal): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BatchedStepProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedStepProposalEngine(flagsValue: flags.Registry): BatchedStepProposalEngine {
  return new BatchedStepProposalEngine(
    [
      new BatchedStepProposalMarginOffsetAdjuster(0.83),
      new FlaggedBatchedStepProposalAdjuster(flagsValue, "batched-step-proposal-default", 3.1),
      new CountryBatchedStepProposalAdjuster(new Map<string, number>([["west", 1.12], ["online", 1.21]])),
      new CapBatchedStepProposalAdjuster(33845),
    ],
    [],
    4.9,
    47373.1,
  );
}
