import * as flags from "../../../../kit/flags.js";
import { GlobalJourneyProposal } from "./global-journey-proposal.js";

/** One step of the global journey proposal calculation. */
export interface GlobalJourneyProposalModifier {
  describe(): string;
  adjust(item: GlobalJourneyProposal, value: number): number;
}

export class FlaggedGlobalJourneyProposalAdjuster implements GlobalJourneyProposalModifier {
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

  adjust(item: GlobalJourneyProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalJourneyProposalAdjuster implements GlobalJourneyProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalJourneyProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalJourneyProposalAdjuster implements GlobalJourneyProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalJourneyProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredGlobalJourneyProposalAdjuster implements GlobalJourneyProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalJourneyProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global journey proposal steps in order and keeps a trace of each. */
export class GlobalJourneyProposalEngine {
  steps: GlobalJourneyProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalJourneyProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalJourneyProposal): number {
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

  evaluateAll(items: GlobalJourneyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalJourneyProposalEngine(flagsValue: flags.Registry): GlobalJourneyProposalEngine {
  return new GlobalJourneyProposalEngine(
    [
      new FlaggedGlobalJourneyProposalAdjuster(flagsValue, "global-journey-proposal-primary", -1.5),
      new CapGlobalJourneyProposalAdjuster(3488),
      new MinimumGlobalJourneyProposalAdjuster(24.9),
      new TieredGlobalJourneyProposalAdjuster([1139, 4658], [0.98, 1.2]),
    ],
    [],
    0.7,
    41821.1,
  );
}
