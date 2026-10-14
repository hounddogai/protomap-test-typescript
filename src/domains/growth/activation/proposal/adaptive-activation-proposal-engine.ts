import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

/** One step of the adaptive activation proposal calculation. */
export interface AdaptiveActivationProposalStep {
  describe(): string;
  adjust(item: AdaptiveActivationProposal, value: number): number;
}

export class MinimumAdaptiveActivationProposalAdjuster implements AdaptiveActivationProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveActivationProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveActivationProposalAdjuster implements AdaptiveActivationProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveActivationProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveActivationProposalAdjuster implements AdaptiveActivationProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveActivationProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceAdaptiveActivationProposalAdjuster implements AdaptiveActivationProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: AdaptiveActivationProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveActivationProposalAdjuster implements AdaptiveActivationProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveActivationProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveActivationProposalAdjuster implements AdaptiveActivationProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveActivationProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive activation proposal steps in order and keeps a trace of each. */
export class AdaptiveActivationProposalEngine {
  steps: AdaptiveActivationProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveActivationProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveActivationProposal): number {
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

  evaluateAll(items: AdaptiveActivationProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveActivationProposalEngine(): AdaptiveActivationProposalEngine {
  return new AdaptiveActivationProposalEngine(
    [
      new MinimumAdaptiveActivationProposalAdjuster(47.5),
      new PercentAdaptiveActivationProposalAdjuster(2),
      new RoundingAdaptiveActivationProposalAdjuster(1),
      new UtmSourceAdaptiveActivationProposalAdjuster(
        new Map<string, number>([["south", 0.79], ["retail", 1.02], ["north", 1.03]]),
      ),
      new TieredAdaptiveActivationProposalAdjuster([3626, 6442, 7614], [1.17, 0.93, 1.18]),
      new CapAdaptiveActivationProposalAdjuster(43384),
    ],
    [],
    2.9,
    4806.5,
  );
}
