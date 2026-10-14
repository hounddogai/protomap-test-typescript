import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPreferenceProposal } from "./fallback-preference-proposal.js";

/** One step of the fallback preference proposal calculation. */
export interface FallbackPreferenceProposalFactor {
  describe(): string;
  adjust(item: FallbackPreferenceProposal, value: number): number;
}

export class FlaggedFallbackPreferenceProposalAdjuster implements FallbackPreferenceProposalFactor {
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

  adjust(item: FallbackPreferenceProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackPreferenceProposalUpdatedAtOffsetAdjuster implements FallbackPreferenceProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: FallbackPreferenceProposal, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentFallbackPreferenceProposalAdjuster implements FallbackPreferenceProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPreferenceProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackPreferenceProposalAdjuster implements FallbackPreferenceProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPreferenceProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback preference proposal steps in order and keeps a trace of each. */
export class FallbackPreferenceProposalEngine {
  steps: FallbackPreferenceProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPreferenceProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackPreferenceProposal): number {
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

  evaluateAll(items: FallbackPreferenceProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackPreferenceProposalEngine(flagsValue: flags.Registry): FallbackPreferenceProposalEngine {
  return new FallbackPreferenceProposalEngine(
    [
      new FlaggedFallbackPreferenceProposalAdjuster(flagsValue, "fallback-preference-proposal-lenient", -6),
      new FallbackPreferenceProposalUpdatedAtOffsetAdjuster(0.7),
      new PercentFallbackPreferenceProposalAdjuster(-8.1),
      new RoundingFallbackPreferenceProposalAdjuster(1),
    ],
    [],
    0.2,
    89143.2,
  );
}
