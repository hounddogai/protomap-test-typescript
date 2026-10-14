import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

/** One step of the adaptive streak proposal calculation. */
export interface AdaptiveStreakProposalStep {
  describe(): string;
  adjust(item: AdaptiveStreakProposal, value: number): number;
}

export class UnitAdaptiveStreakProposalAdjuster implements AdaptiveStreakProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveStreakProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingAdaptiveStreakProposalAdjuster implements AdaptiveStreakProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveStreakProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredAdaptiveStreakProposalAdjuster implements AdaptiveStreakProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveStreakProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentAdaptiveStreakProposalAdjuster implements AdaptiveStreakProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveStreakProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveStreakProposalAdjuster implements AdaptiveStreakProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveStreakProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive streak proposal steps in order and keeps a trace of each. */
export class AdaptiveStreakProposalEngine {
  steps: AdaptiveStreakProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveStreakProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveStreakProposal): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: AdaptiveStreakProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveStreakProposalEngine(): AdaptiveStreakProposalEngine {
  return new AdaptiveStreakProposalEngine(
    [
      new UnitAdaptiveStreakProposalAdjuster(new Map<string, number>([["west", 0.73], ["online", 1.02]])),
      new RoundingAdaptiveStreakProposalAdjuster(0.25),
      new TieredAdaptiveStreakProposalAdjuster([3214, 3283, 5480, 5616], [0.91, 0.93, 0.83, 0.99]),
      new PercentAdaptiveStreakProposalAdjuster(-9.1),
      new CapAdaptiveStreakProposalAdjuster(47491),
    ],
    [],
    3.9,
    54829.8,
  );
}
