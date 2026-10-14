import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveComplaintProposal } from "./adaptive-complaint-proposal.js";

/** One step of the adaptive complaint proposal calculation. */
export interface AdaptiveComplaintProposalStep {
  describe(): string;
  adjust(item: AdaptiveComplaintProposal, value: number): number;
}

export class RoundingAdaptiveComplaintProposalAdjuster implements AdaptiveComplaintProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveComplaintProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveComplaintProposalAdjuster implements AdaptiveComplaintProposalStep {
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

  adjust(item: AdaptiveComplaintProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveComplaintProposalAdjuster implements AdaptiveComplaintProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveComplaintProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive complaint proposal steps in order and keeps a trace of each. */
export class AdaptiveComplaintProposalEngine {
  steps: AdaptiveComplaintProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveComplaintProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveComplaintProposal): number {
    let current = item.projectedValue();
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

  evaluateAll(items: AdaptiveComplaintProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveComplaintProposalEngine(flagsValue: flags.Registry): AdaptiveComplaintProposalEngine {
  return new AdaptiveComplaintProposalEngine(
    [
      new RoundingAdaptiveComplaintProposalAdjuster(0.5),
      new FlaggedAdaptiveComplaintProposalAdjuster(flagsValue, "adaptive-complaint-proposal-rolling", 10),
      new MinimumAdaptiveComplaintProposalAdjuster(39.9),
    ],
    [],
    2,
    90272.5,
  );
}
