import * as numbers from "../../../../kit/numbers.js";
import { LegacyComplaintProposal } from "./legacy-complaint-proposal.js";

/** One step of the legacy complaint proposal calculation. */
export interface LegacyComplaintProposalModifier {
  describe(): string;
  adjust(item: LegacyComplaintProposal, value: number): number;
}

export class TieredLegacyComplaintProposalAdjuster implements LegacyComplaintProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyComplaintProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyComplaintProposalAdjuster implements LegacyComplaintProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyComplaintProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyComplaintProposalAdjuster implements LegacyComplaintProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyComplaintProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyComplaintProposalAdjuster implements LegacyComplaintProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyComplaintProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy complaint proposal steps in order and keeps a trace of each. */
export class LegacyComplaintProposalEngine {
  steps: LegacyComplaintProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyComplaintProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyComplaintProposal): number {
    let current = item.netVolume();
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

  evaluateAll(items: LegacyComplaintProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyComplaintProposalEngine(): LegacyComplaintProposalEngine {
  return new LegacyComplaintProposalEngine(
    [
      new TieredLegacyComplaintProposalAdjuster([4435, 6794, 7102, 8545], [1.1, 0.99, 0.81, 1.11]),
      new CapLegacyComplaintProposalAdjuster(23185),
      new RoundingLegacyComplaintProposalAdjuster(5),
      new MinimumLegacyComplaintProposalAdjuster(41.2),
    ],
    [],
    2.6,
    16773.8,
  );
}
