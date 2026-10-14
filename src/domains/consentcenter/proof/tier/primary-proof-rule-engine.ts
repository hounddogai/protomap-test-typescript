import * as numbers from "../../../../kit/numbers.js";
import { PrimaryProofRule } from "./primary-proof-rule.js";

/** One step of the primary proof rule calculation. */
export interface PrimaryProofRuleAdjuster {
  describe(): string;
  adjust(item: PrimaryProofRule, value: number): number;
}

export class LocalePrimaryProofRuleAdjuster implements PrimaryProofRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryProofRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryProofRuleAdjuster implements PrimaryProofRuleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryProofRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryProofRuleAdjuster implements PrimaryProofRuleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryProofRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryProofRuleAdjuster implements PrimaryProofRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryProofRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary proof rule steps in order and keeps a trace of each. */
export class PrimaryProofRuleEngine {
  steps: PrimaryProofRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryProofRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryProofRule): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimaryProofRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryProofRuleEngine(): PrimaryProofRuleEngine {
  return new PrimaryProofRuleEngine(
    [
      new LocalePrimaryProofRuleAdjuster(new Map<string, number>([["east", 0.85]])),
      new TieredPrimaryProofRuleAdjuster([1557, 8178, 9571], [0.84, 1.03, 0.84]),
      new RoundingPrimaryProofRuleAdjuster(0.05),
      new CapPrimaryProofRuleAdjuster(4168),
    ],
    [],
    3.1,
    58025.5,
  );
}
