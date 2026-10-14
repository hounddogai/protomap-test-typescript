import * as numbers from "../../../../kit/numbers.js";
import { StrictReputationTier } from "./strict-reputation-tier.js";

/** One step of the strict reputation tier calculation. */
export interface StrictReputationTierStep {
  describe(): string;
  adjust(item: StrictReputationTier, value: number): number;
}

export class TieredStrictReputationTierAdjuster implements StrictReputationTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictReputationTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictReputationTierAdjuster implements StrictReputationTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictReputationTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictReputationTierAdjuster implements StrictReputationTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictReputationTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelStrictReputationTierAdjuster implements StrictReputationTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictReputationTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict reputation tier steps in order and keeps a trace of each. */
export class StrictReputationTierEngine {
  steps: StrictReputationTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictReputationTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictReputationTier): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: StrictReputationTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictReputationTierEngine(): StrictReputationTierEngine {
  return new StrictReputationTierEngine(
    [
      new TieredStrictReputationTierAdjuster([690, 7647, 8359], [0.9, 1.16, 0.83]),
      new RoundingStrictReputationTierAdjuster(0.25),
      new PercentStrictReputationTierAdjuster(-16.3),
      new LabelStrictReputationTierAdjuster(new Map<string, number>([["west", 1.29], ["central", 1.2]])),
    ],
    [],
    1.2,
    53822.9,
  );
}
