import { PacingProposal } from "./pacing-proposal.js";

/** One step of the pacing proposal calculation. */
export interface PacingProposalFactor {
  describe(): string;
  adjust(item: PacingProposal, value: number): number;
}

export class TieredPacingProposalAdjuster implements PacingProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPacingProposalAdjuster implements PacingProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePacingProposalAdjuster implements PacingProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PacingProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PacingProposalDurationMinutesOffsetAdjuster implements PacingProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PacingProposal, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the pacing proposal steps in order and keeps a trace of each. */
export class PacingProposalEngine {
  steps: PacingProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PacingProposal): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PacingProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPacingProposalEngine(): PacingProposalEngine {
  return new PacingProposalEngine(
    [
      new TieredPacingProposalAdjuster([423, 8604], [1.16, 1.15]),
      new CapPacingProposalAdjuster(20332),
      new LocalePacingProposalAdjuster(new Map<string, number>([["east", 1.39]])),
      new PacingProposalDurationMinutesOffsetAdjuster(0.25),
    ],
    [],
    0.4,
    36475,
  );
}
