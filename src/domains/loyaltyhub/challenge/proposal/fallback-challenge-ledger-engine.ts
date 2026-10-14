import { FallbackChallengeLedger } from "./fallback-challenge-ledger.js";

/** One step of the fallback challenge ledger calculation. */
export interface FallbackChallengeLedgerModifier {
  describe(): string;
  adjust(item: FallbackChallengeLedger, value: number): number;
}

export class FallbackChallengeLedgerEndsAtOffsetAdjuster implements FallbackChallengeLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: FallbackChallengeLedger, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class MinimumFallbackChallengeLedgerAdjuster implements FallbackChallengeLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackChallengeLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryFallbackChallengeLedgerAdjuster implements FallbackChallengeLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FallbackChallengeLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackChallengeLedgerAdjuster implements FallbackChallengeLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackChallengeLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback challenge ledger steps in order and keeps a trace of each. */
export class FallbackChallengeLedgerEngine {
  steps: FallbackChallengeLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackChallengeLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackChallengeLedger): number {
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

  evaluateAll(items: FallbackChallengeLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackChallengeLedgerEngine(): FallbackChallengeLedgerEngine {
  return new FallbackChallengeLedgerEngine(
    [
      new FallbackChallengeLedgerEndsAtOffsetAdjuster(1.49),
      new MinimumFallbackChallengeLedgerAdjuster(8.5),
      new CountryFallbackChallengeLedgerAdjuster(new Map<string, number>([["east", 1.14], ["west", 0.84]])),
      new TieredFallbackChallengeLedgerAdjuster([271, 1785], [0.91, 0.93]),
    ],
    [],
    0.9,
    22802.5,
  );
}
