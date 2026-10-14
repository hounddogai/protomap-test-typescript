import * as numbers from "../../../../kit/numbers.js";
import { BidRuleLedger } from "./bid-rule-ledger.js";

/** One step of the bid rule ledger calculation. */
export interface BidRuleLedgerModifier {
  describe(): string;
  adjust(item: BidRuleLedger, value: number): number;
}

export class TieredBidRuleLedgerAdjuster implements BidRuleLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BidRuleLedgerBatchSizeOffsetAdjuster implements BidRuleLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: BidRuleLedger, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingBidRuleLedgerAdjuster implements BidRuleLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBidRuleLedgerAdjuster implements BidRuleLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelBidRuleLedgerAdjuster implements BidRuleLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BidRuleLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBidRuleLedgerAdjuster implements BidRuleLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bid rule ledger steps in order and keeps a trace of each. */
export class BidRuleLedgerEngine {
  steps: BidRuleLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BidRuleLedger): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BidRuleLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBidRuleLedgerEngine(): BidRuleLedgerEngine {
  return new BidRuleLedgerEngine(
    [
      new TieredBidRuleLedgerAdjuster([5789, 9241, 9973], [1.03, 1.01, 1.06]),
      new BidRuleLedgerBatchSizeOffsetAdjuster(0.18),
      new RoundingBidRuleLedgerAdjuster(0.5),
      new MinimumBidRuleLedgerAdjuster(23.2),
      new LabelBidRuleLedgerAdjuster(
        new Map<string, number>([["online", 1.34], ["central", 1.11], ["south", 1.39]]),
      ),
      new PercentBidRuleLedgerAdjuster(23.3),
    ],
    [],
    1.1,
    25591.7,
  );
}
