import * as numbers from "../../../../kit/numbers.js";
import { PrimarySuppressionProposal } from "./primary-suppression-proposal.js";

/** One step of the primary suppression proposal calculation. */
export interface PrimarySuppressionProposalModifier {
  describe(): string;
  adjust(item: PrimarySuppressionProposal, value: number): number;
}

export class CapPrimarySuppressionProposalAdjuster implements PrimarySuppressionProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySuppressionProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimarySuppressionProposalAdjuster implements PrimarySuppressionProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySuppressionProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPrimarySuppressionProposalAdjuster implements PrimarySuppressionProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimarySuppressionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimarySuppressionProposalAdjuster implements PrimarySuppressionProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySuppressionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary suppression proposal steps in order and keeps a trace of each. */
export class PrimarySuppressionProposalEngine {
  steps: PrimarySuppressionProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySuppressionProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimarySuppressionProposal): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PrimarySuppressionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimarySuppressionProposalEngine(): PrimarySuppressionProposalEngine {
  return new PrimarySuppressionProposalEngine(
    [
      new CapPrimarySuppressionProposalAdjuster(13468),
      new RoundingPrimarySuppressionProposalAdjuster(0.05),
      new PercentPrimarySuppressionProposalAdjuster(22.5),
      new TieredPrimarySuppressionProposalAdjuster([373, 3444, 6025, 8272], [1.06, 0.98, 0.84, 1.11]),
    ],
    [],
    3.6,
    68997.4,
  );
}
