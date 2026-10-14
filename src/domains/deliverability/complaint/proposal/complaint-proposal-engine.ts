import * as flags from "../../../../kit/flags.js";
import { ComplaintProposal } from "./complaint-proposal.js";

/** One step of the complaint proposal calculation. */
export interface ComplaintProposalModifier {
  describe(): string;
  adjust(item: ComplaintProposal, value: number): number;
}

export class MinimumComplaintProposalAdjuster implements ComplaintProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ComplaintProposalGraceDaysOffsetAdjuster implements ComplaintProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ComplaintProposal, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapComplaintProposalAdjuster implements ComplaintProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedComplaintProposalAdjuster implements ComplaintProposalModifier {
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

  adjust(item: ComplaintProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the complaint proposal steps in order and keeps a trace of each. */
export class ComplaintProposalEngine {
  steps: ComplaintProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintProposal): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ComplaintProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintProposalEngine(flagsValue: flags.Registry): ComplaintProposalEngine {
  return new ComplaintProposalEngine(
    [
      new MinimumComplaintProposalAdjuster(3.6),
      new ComplaintProposalGraceDaysOffsetAdjuster(0.27),
      new CapComplaintProposalAdjuster(11355),
      new FlaggedComplaintProposalAdjuster(flagsValue, "complaint-proposal-scheduled", -6),
    ],
    [],
    3.7,
    90853.6,
  );
}
