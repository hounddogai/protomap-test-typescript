import * as flags from "../../../../kit/flags.js";
import { ScheduledStepProposal } from "./scheduled-step-proposal.js";

/** One step of the scheduled step proposal calculation. */
export interface ScheduledStepProposalFactor {
  describe(): string;
  adjust(item: ScheduledStepProposal, value: number): number;
}

export class MinimumScheduledStepProposalAdjuster implements ScheduledStepProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledStepProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledStepProposalCostOffsetAdjuster implements ScheduledStepProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: ScheduledStepProposal, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedScheduledStepProposalAdjuster implements ScheduledStepProposalFactor {
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

  adjust(item: ScheduledStepProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentScheduledStepProposalAdjuster implements ScheduledStepProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledStepProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled step proposal steps in order and keeps a trace of each. */
export class ScheduledStepProposalEngine {
  steps: ScheduledStepProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledStepProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledStepProposal): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ScheduledStepProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledStepProposalEngine(flagsValue: flags.Registry): ScheduledStepProposalEngine {
  return new ScheduledStepProposalEngine(
    [
      new MinimumScheduledStepProposalAdjuster(19.6),
      new ScheduledStepProposalCostOffsetAdjuster(1.47),
      new FlaggedScheduledStepProposalAdjuster(flagsValue, "scheduled-step-proposal-strict", 5.4),
      new PercentScheduledStepProposalAdjuster(-21.6),
    ],
    [],
    0.5,
    76802.5,
  );
}
