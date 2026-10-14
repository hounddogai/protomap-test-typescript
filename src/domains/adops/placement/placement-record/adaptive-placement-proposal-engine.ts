import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePlacementProposal } from "./adaptive-placement-proposal.js";

/** One step of the adaptive placement proposal calculation. */
export interface AdaptivePlacementProposalModifier {
  describe(): string;
  adjust(item: AdaptivePlacementProposal, value: number): number;
}

export class RoundingAdaptivePlacementProposalAdjuster implements AdaptivePlacementProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptivePlacementProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptivePlacementProposalAdjuster implements AdaptivePlacementProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptivePlacementProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitAdaptivePlacementProposalAdjuster implements AdaptivePlacementProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptivePlacementProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptivePlacementProposalAdjuster implements AdaptivePlacementProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePlacementProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive placement proposal steps in order and keeps a trace of each. */
export class AdaptivePlacementProposalEngine {
  steps: AdaptivePlacementProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePlacementProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptivePlacementProposal): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: AdaptivePlacementProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptivePlacementProposalEngine(): AdaptivePlacementProposalEngine {
  return new AdaptivePlacementProposalEngine(
    [
      new RoundingAdaptivePlacementProposalAdjuster(0.05),
      new MinimumAdaptivePlacementProposalAdjuster(5.5),
      new UnitAdaptivePlacementProposalAdjuster(
        new Map<string, number>([["west", 0.91], ["south", 1.19], ["east", 0.76]]),
      ),
      new TieredAdaptivePlacementProposalAdjuster([1690, 4122, 8149, 8760], [0.8, 0.99, 1.09, 1.13]),
    ],
    [],
    4.4,
    11068.4,
  );
}
