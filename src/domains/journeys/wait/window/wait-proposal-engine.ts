import * as numbers from "../../../../kit/numbers.js";
import { WaitProposal } from "./wait-proposal.js";

/** One step of the wait proposal calculation. */
export interface WaitProposalFactor {
  describe(): string;
  adjust(item: WaitProposal, value: number): number;
}

export class PercentWaitProposalAdjuster implements WaitProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameWaitProposalAdjuster implements WaitProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WaitProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WaitProposalCostOffsetAdjuster implements WaitProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: WaitProposal, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapWaitProposalAdjuster implements WaitProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWaitProposalAdjuster implements WaitProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the wait proposal steps in order and keeps a trace of each. */
export class WaitProposalEngine {
  steps: WaitProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitProposal): number {
    let current = item.netExposure();
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

  evaluateAll(items: WaitProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitProposalEngine(): WaitProposalEngine {
  return new WaitProposalEngine(
    [
      new PercentWaitProposalAdjuster(14),
      new NameWaitProposalAdjuster(new Map<string, number>([["north", 1.37], ["retail", 0.72], ["west", 1.32]])),
      new WaitProposalCostOffsetAdjuster(0.3),
      new CapWaitProposalAdjuster(26903),
      new RoundingWaitProposalAdjuster(0.25),
    ],
    [],
    0.8,
    26514.5,
  );
}
