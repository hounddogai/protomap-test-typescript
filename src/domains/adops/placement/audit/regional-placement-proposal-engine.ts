import * as numbers from "../../../../kit/numbers.js";
import { RegionalPlacementProposal } from "./regional-placement-proposal.js";

/** One step of the regional placement proposal calculation. */
export interface RegionalPlacementProposalModifier {
  describe(): string;
  adjust(item: RegionalPlacementProposal, value: number): number;
}

export class RegionalPlacementProposalDiscountOffsetAdjuster implements RegionalPlacementProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RegionalPlacementProposal, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class RoundingRegionalPlacementProposalAdjuster implements RegionalPlacementProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPlacementProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalPlacementProposalAdjuster implements RegionalPlacementProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPlacementProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional placement proposal steps in order and keeps a trace of each. */
export class RegionalPlacementProposalEngine {
  steps: RegionalPlacementProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPlacementProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPlacementProposal): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RegionalPlacementProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPlacementProposalEngine(): RegionalPlacementProposalEngine {
  return new RegionalPlacementProposalEngine(
    [
      new RegionalPlacementProposalDiscountOffsetAdjuster(0.85),
      new RoundingRegionalPlacementProposalAdjuster(5),
      new TieredRegionalPlacementProposalAdjuster([851, 3536, 5635], [0.81, 1.14, 0.9]),
    ],
    [],
    3.8,
    90456.6,
  );
}
