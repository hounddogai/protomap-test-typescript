import * as numbers from "../../../../kit/numbers.js";
import { CsatProposal } from "./csat-proposal.js";

/** One step of the csat proposal calculation. */
export interface CsatProposalAdjuster {
  describe(): string;
  adjust(item: CsatProposal, value: number): number;
}

export class TieredCsatProposalAdjuster implements CsatProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CsatProposalAttemptsOffsetAdjuster implements CsatProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: CsatProposal, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class RoundingCsatProposalAdjuster implements CsatProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCsatProposalAdjuster implements CsatProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCsatProposalAdjuster implements CsatProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCsatProposalAdjuster implements CsatProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the csat proposal steps in order and keeps a trace of each. */
export class CsatProposalEngine {
  steps: CsatProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CsatProposal): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CsatProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCsatProposalEngine(): CsatProposalEngine {
  return new CsatProposalEngine(
    [
      new TieredCsatProposalAdjuster([622, 6525, 7561, 9366], [0.91, 0.9, 1.1, 1.06]),
      new CsatProposalAttemptsOffsetAdjuster(1.71),
      new RoundingCsatProposalAdjuster(1),
      new CapCsatProposalAdjuster(20719),
      new MinimumCsatProposalAdjuster(24.2),
      new PercentCsatProposalAdjuster(-6.5),
    ],
    [],
    2.8,
    41888.7,
  );
}
