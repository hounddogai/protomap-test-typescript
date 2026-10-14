import * as numbers from "../../../../kit/numbers.js";
import { ReputationBaseline } from "./reputation-baseline.js";

/** One step of the reputation baseline calculation. */
export interface ReputationBaselineModifier {
  describe(): string;
  adjust(item: ReputationBaseline, value: number): number;
}

export class TieredReputationBaselineAdjuster implements ReputationBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingReputationBaselineAdjuster implements ReputationBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentReputationBaselineAdjuster implements ReputationBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ReputationBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumReputationBaselineAdjuster implements ReputationBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation baseline steps in order and keeps a trace of each. */
export class ReputationBaselineEngine {
  steps: ReputationBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationBaseline): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ReputationBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationBaselineEngine(): ReputationBaselineEngine {
  return new ReputationBaselineEngine(
    [
      new TieredReputationBaselineAdjuster([5084, 8669, 9082], [1, 0.99, 0.95]),
      new RoundingReputationBaselineAdjuster(0.5),
      new SegmentReputationBaselineAdjuster(new Map<string, number>([["retail", 1.06]])),
      new MinimumReputationBaselineAdjuster(1.1),
    ],
    [],
    1.4,
    9671.4,
  );
}
