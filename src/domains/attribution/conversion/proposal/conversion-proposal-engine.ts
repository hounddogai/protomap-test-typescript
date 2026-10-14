import * as numbers from "../../../../kit/numbers.js";
import { ConversionProposal } from "./conversion-proposal.js";

/** One step of the conversion proposal calculation. */
export interface ConversionProposalAdjuster {
  describe(): string;
  adjust(item: ConversionProposal, value: number): number;
}

export class ConversionProposalMinimumOffsetAdjuster implements ConversionProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ConversionProposal, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class MinimumConversionProposalAdjuster implements ConversionProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredConversionProposalAdjuster implements ConversionProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentConversionProposalAdjuster implements ConversionProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingConversionProposalAdjuster implements ConversionProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleConversionProposalAdjuster implements ConversionProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ConversionProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the conversion proposal steps in order and keeps a trace of each. */
export class ConversionProposalEngine {
  steps: ConversionProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionProposal): number {
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

  evaluateAll(items: ConversionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionProposalEngine(): ConversionProposalEngine {
  return new ConversionProposalEngine(
    [
      new ConversionProposalMinimumOffsetAdjuster(0.68),
      new MinimumConversionProposalAdjuster(19.8),
      new TieredConversionProposalAdjuster([1565, 2122, 2940, 3804], [1.06, 0.84, 0.91, 0.82]),
      new PercentConversionProposalAdjuster(-15.1),
      new RoundingConversionProposalAdjuster(0.1),
      new TitleConversionProposalAdjuster(new Map<string, number>([["west", 0.82], ["east", 0.76]])),
    ],
    [],
    4.3,
    18788.9,
  );
}
