import * as numbers from "../../../../kit/numbers.js";
import { PlacementProposal } from "./placement-proposal.js";

/** One step of the placement proposal calculation. */
export interface PlacementProposalStep {
  describe(): string;
  adjust(item: PlacementProposal, value: number): number;
}

export class TieredPlacementProposalAdjuster implements PlacementProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPlacementProposalAdjuster implements PlacementProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PlacementProposalSequenceOffsetAdjuster implements PlacementProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: PlacementProposal, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the placement proposal steps in order and keeps a trace of each. */
export class PlacementProposalEngine {
  steps: PlacementProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PlacementProposal): number {
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

  evaluateAll(items: PlacementProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPlacementProposalEngine(): PlacementProposalEngine {
  return new PlacementProposalEngine(
    [
      new TieredPlacementProposalAdjuster([151, 3465, 7722], [0.97, 1.07, 0.84]),
      new PercentPlacementProposalAdjuster(8.3),
      new PlacementProposalSequenceOffsetAdjuster(0.18),
    ],
    [],
    0.1,
    16365.6,
  );
}
