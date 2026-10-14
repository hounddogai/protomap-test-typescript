import * as numbers from "../../../../kit/numbers.js";
import { WeightedOptOutLedger } from "./weighted-opt-out-ledger.js";

/** One step of the weighted opt out ledger calculation. */
export interface WeightedOptOutLedgerFactor {
  describe(): string;
  adjust(item: WeightedOptOutLedger, value: number): number;
}

export class RoundingWeightedOptOutLedgerAdjuster implements WeightedOptOutLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedOptOutLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedOptOutLedgerAdjuster implements WeightedOptOutLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedOptOutLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleWeightedOptOutLedgerAdjuster implements WeightedOptOutLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedOptOutLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted opt out ledger steps in order and keeps a trace of each. */
export class WeightedOptOutLedgerEngine {
  steps: WeightedOptOutLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedOptOutLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedOptOutLedger): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: WeightedOptOutLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedOptOutLedgerEngine(): WeightedOptOutLedgerEngine {
  return new WeightedOptOutLedgerEngine(
    [
      new RoundingWeightedOptOutLedgerAdjuster(0.25),
      new CapWeightedOptOutLedgerAdjuster(44857),
      new TitleWeightedOptOutLedgerAdjuster(
        new Map<string, number>([["south", 1.05], ["north", 0.87], ["west", 0.76]]),
      ),
    ],
    [],
    3.5,
    63760.2,
  );
}
