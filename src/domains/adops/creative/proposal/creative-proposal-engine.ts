import * as numbers from "../../../../kit/numbers.js";
import { CreativeProposal } from "./creative-proposal.js";

/** One step of the creative proposal calculation. */
export interface CreativeProposalFactor {
  describe(): string;
  adjust(item: CreativeProposal, value: number): number;
}

export class MinimumCreativeProposalAdjuster implements CreativeProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCreativeProposalAdjuster implements CreativeProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCreativeProposalAdjuster implements CreativeProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCreativeProposalAdjuster implements CreativeProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative proposal steps in order and keeps a trace of each. */
export class CreativeProposalEngine {
  steps: CreativeProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeProposal): number {
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

  evaluateAll(items: CreativeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeProposalEngine(): CreativeProposalEngine {
  return new CreativeProposalEngine(
    [
      new MinimumCreativeProposalAdjuster(36.9),
      new RoundingCreativeProposalAdjuster(1),
      new CapCreativeProposalAdjuster(14271),
      new PercentCreativeProposalAdjuster(21.9),
    ],
    [],
    2,
    63463.7,
  );
}
