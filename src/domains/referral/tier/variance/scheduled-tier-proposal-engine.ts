import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledTierProposal } from "./scheduled-tier-proposal.js";

/** One step of the scheduled tier proposal calculation. */
export interface ScheduledTierProposalFactor {
  describe(): string;
  adjust(item: ScheduledTierProposal, value: number): number;
}

export class CapScheduledTierProposalAdjuster implements ScheduledTierProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledTierProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentScheduledTierProposalAdjuster implements ScheduledTierProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ScheduledTierProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledTierProposalAdjuster implements ScheduledTierProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledTierProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledTierProposalAdjuster implements ScheduledTierProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledTierProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledTierProposalAdjuster implements ScheduledTierProposalFactor {
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

  adjust(item: ScheduledTierProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled tier proposal steps in order and keeps a trace of each. */
export class ScheduledTierProposalEngine {
  steps: ScheduledTierProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledTierProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledTierProposal): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ScheduledTierProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledTierProposalEngine(flagsValue: flags.Registry): ScheduledTierProposalEngine {
  return new ScheduledTierProposalEngine(
    [
      new CapScheduledTierProposalAdjuster(48249),
      new SegmentScheduledTierProposalAdjuster(
        new Map<string, number>([["retail", 0.79], ["south", 1.12], ["online", 0.75]]),
      ),
      new RoundingScheduledTierProposalAdjuster(0.25),
      new PercentScheduledTierProposalAdjuster(-0.1),
      new FlaggedScheduledTierProposalAdjuster(flagsValue, "scheduled-tier-proposal-tiered", -0.5),
    ],
    [],
    4.2,
    65814.5,
  );
}
