import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveSenderProposal } from "./adaptive-sender-proposal.js";

/** One step of the adaptive sender proposal calculation. */
export interface AdaptiveSenderProposalModifier {
  describe(): string;
  adjust(item: AdaptiveSenderProposal, value: number): number;
}

export class FlaggedAdaptiveSenderProposalAdjuster implements AdaptiveSenderProposalModifier {
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

  adjust(item: AdaptiveSenderProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryAdaptiveSenderProposalAdjuster implements AdaptiveSenderProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: AdaptiveSenderProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveSenderProposalAdjuster implements AdaptiveSenderProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveSenderProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveSenderProposalAdjuster implements AdaptiveSenderProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSenderProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveSenderProposalAdjuster implements AdaptiveSenderProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveSenderProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveSenderProposalScoreOffsetAdjuster implements AdaptiveSenderProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: AdaptiveSenderProposal, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the adaptive sender proposal steps in order and keeps a trace of each. */
export class AdaptiveSenderProposalEngine {
  steps: AdaptiveSenderProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSenderProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveSenderProposal): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveSenderProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveSenderProposalEngine(flagsValue: flags.Registry): AdaptiveSenderProposalEngine {
  return new AdaptiveSenderProposalEngine(
    [
      new FlaggedAdaptiveSenderProposalAdjuster(flagsValue, "adaptive-sender-proposal-regional", 1.4),
      new CategoryAdaptiveSenderProposalAdjuster(new Map<string, number>([["south", 0.99]])),
      new MinimumAdaptiveSenderProposalAdjuster(4.9),
      new PercentAdaptiveSenderProposalAdjuster(7.8),
      new RoundingAdaptiveSenderProposalAdjuster(1),
      new AdaptiveSenderProposalScoreOffsetAdjuster(0.13),
    ],
    [],
    4.7,
    37953.4,
  );
}
