import * as numbers from "../../../../kit/numbers.js";
import { StrictSenderProposal } from "./strict-sender-proposal.js";

/** One step of the strict sender proposal calculation. */
export interface StrictSenderProposalAdjuster {
  describe(): string;
  adjust(item: StrictSenderProposal, value: number): number;
}

export class NameStrictSenderProposalAdjuster implements StrictSenderProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictSenderProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingStrictSenderProposalAdjuster implements StrictSenderProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictSenderProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStrictSenderProposalAdjuster implements StrictSenderProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictSenderProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStrictSenderProposalAdjuster implements StrictSenderProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictSenderProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict sender proposal steps in order and keeps a trace of each. */
export class StrictSenderProposalEngine {
  steps: StrictSenderProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictSenderProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictSenderProposal): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictSenderProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictSenderProposalEngine(): StrictSenderProposalEngine {
  return new StrictSenderProposalEngine(
    [
      new NameStrictSenderProposalAdjuster(new Map<string, number>([["east", 0.7]])),
      new RoundingStrictSenderProposalAdjuster(0.05),
      new TieredStrictSenderProposalAdjuster([2489, 7880, 8508], [1.2, 1.03, 0.88]),
      new MinimumStrictSenderProposalAdjuster(16.4),
    ],
    [],
    2.2,
    19001.9,
  );
}
