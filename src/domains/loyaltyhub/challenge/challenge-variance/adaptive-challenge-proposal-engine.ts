import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveChallengeProposal } from "./adaptive-challenge-proposal.js";

/** One step of the adaptive challenge proposal calculation. */
export interface AdaptiveChallengeProposalAdjuster {
  describe(): string;
  adjust(item: AdaptiveChallengeProposal, value: number): number;
}

export class FlaggedAdaptiveChallengeProposalAdjuster implements AdaptiveChallengeProposalAdjuster {
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

  adjust(item: AdaptiveChallengeProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameAdaptiveChallengeProposalAdjuster implements AdaptiveChallengeProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveChallengeProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentAdaptiveChallengeProposalAdjuster implements AdaptiveChallengeProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveChallengeProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive challenge proposal steps in order and keeps a trace of each. */
export class AdaptiveChallengeProposalEngine {
  steps: AdaptiveChallengeProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveChallengeProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveChallengeProposal): number {
    let current = item.netExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: AdaptiveChallengeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveChallengeProposalEngine(flagsValue: flags.Registry): AdaptiveChallengeProposalEngine {
  return new AdaptiveChallengeProposalEngine(
    [
      new FlaggedAdaptiveChallengeProposalAdjuster(flagsValue, "adaptive-challenge-proposal-rolling", 7.5),
      new NameAdaptiveChallengeProposalAdjuster(new Map<string, number>([["east", 1.13], ["west", 1.11]])),
      new PercentAdaptiveChallengeProposalAdjuster(16.7),
    ],
    [],
    3.1,
    88871.9,
  );
}
