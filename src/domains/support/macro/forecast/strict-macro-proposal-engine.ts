import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictMacroProposal } from "./strict-macro-proposal.js";

/** One step of the strict macro proposal calculation. */
export interface StrictMacroProposalAdjuster {
  describe(): string;
  adjust(item: StrictMacroProposal, value: number): number;
}

export class RoundingStrictMacroProposalAdjuster implements StrictMacroProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictMacroProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictMacroProposalCeilingOffsetAdjuster implements StrictMacroProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: StrictMacroProposal, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class FlaggedStrictMacroProposalAdjuster implements StrictMacroProposalAdjuster {
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

  adjust(item: StrictMacroProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameStrictMacroProposalAdjuster implements StrictMacroProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictMacroProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStrictMacroProposalAdjuster implements StrictMacroProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictMacroProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict macro proposal steps in order and keeps a trace of each. */
export class StrictMacroProposalEngine {
  steps: StrictMacroProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictMacroProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictMacroProposal): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictMacroProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictMacroProposalEngine(flagsValue: flags.Registry): StrictMacroProposalEngine {
  return new StrictMacroProposalEngine(
    [
      new RoundingStrictMacroProposalAdjuster(5),
      new StrictMacroProposalCeilingOffsetAdjuster(1.29),
      new FlaggedStrictMacroProposalAdjuster(flagsValue, "strict-macro-proposal-primary", 2.6),
      new NameStrictMacroProposalAdjuster(new Map<string, number>([["retail", 0.74], ["north", 1.29]])),
      new PercentStrictMacroProposalAdjuster(-23.7),
    ],
    [],
    0.3,
    65254.5,
  );
}
