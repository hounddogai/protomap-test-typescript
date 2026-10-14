import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveRewardRuleProposal } from "./adaptive-reward-rule-proposal.js";

/** One step of the adaptive reward rule proposal calculation. */
export interface AdaptiveRewardRuleProposalAdjuster {
  describe(): string;
  adjust(item: AdaptiveRewardRuleProposal, value: number): number;
}

export class FlaggedAdaptiveRewardRuleProposalAdjuster implements AdaptiveRewardRuleProposalAdjuster {
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

  adjust(item: AdaptiveRewardRuleProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveRewardRuleProposalAdjuster implements AdaptiveRewardRuleProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveRewardRuleProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveRewardRuleProposalAdjuster implements AdaptiveRewardRuleProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveRewardRuleProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveRewardRuleProposalClicksOffsetAdjuster implements AdaptiveRewardRuleProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: AdaptiveRewardRuleProposal, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class RoundingAdaptiveRewardRuleProposalAdjuster implements AdaptiveRewardRuleProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveRewardRuleProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive reward rule proposal steps in order and keeps a trace of each. */
export class AdaptiveRewardRuleProposalEngine {
  steps: AdaptiveRewardRuleProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveRewardRuleProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveRewardRuleProposal): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveRewardRuleProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveRewardRuleProposalEngine(flagsValue: flags.Registry): AdaptiveRewardRuleProposalEngine {
  return new AdaptiveRewardRuleProposalEngine(
    [
      new FlaggedAdaptiveRewardRuleProposalAdjuster(flagsValue, "adaptive-reward-rule-proposal-default", -8.3),
      new MinimumAdaptiveRewardRuleProposalAdjuster(28.7),
      new CapAdaptiveRewardRuleProposalAdjuster(31196),
      new AdaptiveRewardRuleProposalClicksOffsetAdjuster(0.68),
      new RoundingAdaptiveRewardRuleProposalAdjuster(0.5),
    ],
    [],
    1.9,
    97351.6,
  );
}
