import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationProposal } from "./reputation-proposal.js";

/** One step of the reputation proposal calculation. */
export interface ReputationProposalFactor {
  describe(): string;
  adjust(item: ReputationProposal, value: number): number;
}

export class PercentReputationProposalAdjuster implements ReputationProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ReputationProposalEndsAtOffsetAdjuster implements ReputationProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ReputationProposal, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingReputationProposalAdjuster implements ReputationProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedReputationProposalAdjuster implements ReputationProposalFactor {
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

  adjust(item: ReputationProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumReputationProposalAdjuster implements ReputationProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation proposal steps in order and keeps a trace of each. */
export class ReputationProposalEngine {
  steps: ReputationProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationProposal): number {
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

  evaluateAll(items: ReputationProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationProposalEngine(flagsValue: flags.Registry): ReputationProposalEngine {
  return new ReputationProposalEngine(
    [
      new PercentReputationProposalAdjuster(6.8),
      new ReputationProposalEndsAtOffsetAdjuster(0.19),
      new RoundingReputationProposalAdjuster(0.5),
      new FlaggedReputationProposalAdjuster(flagsValue, "reputation-proposal-capped", -6.1),
      new MinimumReputationProposalAdjuster(28.8),
    ],
    [],
    4.1,
    38383.8,
  );
}
