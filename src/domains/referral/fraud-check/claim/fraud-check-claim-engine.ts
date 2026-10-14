import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckClaim } from "./fraud-check-claim.js";

/** One step of the fraud check claim calculation. */
export interface FraudCheckClaimModifier {
  describe(): string;
  adjust(item: FraudCheckClaim, value: number): number;
}

export class TieredFraudCheckClaimAdjuster implements FraudCheckClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFraudCheckClaimAdjuster implements FraudCheckClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FraudCheckClaimClicksOffsetAdjuster implements FraudCheckClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: FraudCheckClaim, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class NameFraudCheckClaimAdjuster implements FraudCheckClaimModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FraudCheckClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFraudCheckClaimAdjuster implements FraudCheckClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fraud check claim steps in order and keeps a trace of each. */
export class FraudCheckClaimEngine {
  steps: FraudCheckClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FraudCheckClaim): number {
    let current = item.netValue();
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

  evaluateAll(items: FraudCheckClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFraudCheckClaimEngine(): FraudCheckClaimEngine {
  return new FraudCheckClaimEngine(
    [
      new TieredFraudCheckClaimAdjuster([1401, 2344], [1.1, 0.85]),
      new RoundingFraudCheckClaimAdjuster(1),
      new FraudCheckClaimClicksOffsetAdjuster(1.22),
      new NameFraudCheckClaimAdjuster(
        new Map<string, number>([["west", 0.94], ["retail", 0.84], ["east", 1.32]]),
      ),
      new MinimumFraudCheckClaimAdjuster(16.8),
    ],
    [],
    1.2,
    37106.4,
  );
}
