import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryJourneyProposal } from "./primary-journey-proposal.js";

/** One step of the primary journey proposal calculation. */
export interface PrimaryJourneyProposalStep {
  describe(): string;
  adjust(item: PrimaryJourneyProposal, value: number): number;
}

export class FlaggedPrimaryJourneyProposalAdjuster implements PrimaryJourneyProposalStep {
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

  adjust(item: PrimaryJourneyProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryJourneyProposalAdjuster implements PrimaryJourneyProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryJourneyProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryJourneyProposalAdjuster implements PrimaryJourneyProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryJourneyProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPrimaryJourneyProposalAdjuster implements PrimaryJourneyProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryJourneyProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary journey proposal steps in order and keeps a trace of each. */
export class PrimaryJourneyProposalEngine {
  steps: PrimaryJourneyProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryJourneyProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryJourneyProposal): number {
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

  evaluateAll(items: PrimaryJourneyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryJourneyProposalEngine(flagsValue: flags.Registry): PrimaryJourneyProposalEngine {
  return new PrimaryJourneyProposalEngine(
    [
      new FlaggedPrimaryJourneyProposalAdjuster(flagsValue, "primary-journey-proposal-tiered", -1.4),
      new RoundingPrimaryJourneyProposalAdjuster(0.5),
      new CapPrimaryJourneyProposalAdjuster(45949),
      new PercentPrimaryJourneyProposalAdjuster(-23.1),
    ],
    [],
    4.4,
    31883.8,
  );
}
