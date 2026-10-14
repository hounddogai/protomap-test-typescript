import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

/** One step of the weighted redemption proposal calculation. */
export interface WeightedRedemptionProposalModifier {
  describe(): string;
  adjust(item: WeightedRedemptionProposal, value: number): number;
}

export class RoundingWeightedRedemptionProposalAdjuster implements WeightedRedemptionProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRedemptionProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedRedemptionProposalAdjuster implements WeightedRedemptionProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRedemptionProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWeightedRedemptionProposalAdjuster implements WeightedRedemptionProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRedemptionProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWeightedRedemptionProposalAdjuster implements WeightedRedemptionProposalModifier {
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

  adjust(item: WeightedRedemptionProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWeightedRedemptionProposalAdjuster implements WeightedRedemptionProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedRedemptionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted redemption proposal steps in order and keeps a trace of each. */
export class WeightedRedemptionProposalEngine {
  steps: WeightedRedemptionProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRedemptionProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedRedemptionProposal): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedRedemptionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedRedemptionProposalEngine(flagsValue: flags.Registry): WeightedRedemptionProposalEngine {
  return new WeightedRedemptionProposalEngine(
    [
      new RoundingWeightedRedemptionProposalAdjuster(0.1),
      new CapWeightedRedemptionProposalAdjuster(30906),
      new MinimumWeightedRedemptionProposalAdjuster(16.1),
      new FlaggedWeightedRedemptionProposalAdjuster(flagsValue, "weighted-redemption-proposal-scheduled", -5.6),
      new PercentWeightedRedemptionProposalAdjuster(5.6),
    ],
    [],
    1.9,
    52117.9,
  );
}
