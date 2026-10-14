import { WeightedActivationLedger } from "./weighted-activation-ledger.js";

/** One step of the weighted activation ledger calculation. */
export interface WeightedActivationLedgerStep {
  describe(): string;
  adjust(item: WeightedActivationLedger, value: number): number;
}

export class PercentWeightedActivationLedgerAdjuster implements WeightedActivationLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedActivationLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedActivationLedgerAdjuster implements WeightedActivationLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedActivationLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedActivationLedgerAdjuster implements WeightedActivationLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedActivationLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted activation ledger steps in order and keeps a trace of each. */
export class WeightedActivationLedgerEngine {
  steps: WeightedActivationLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedActivationLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedActivationLedger): number {
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

  evaluateAll(items: WeightedActivationLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedActivationLedgerEngine(): WeightedActivationLedgerEngine {
  return new WeightedActivationLedgerEngine(
    [
      new PercentWeightedActivationLedgerAdjuster(1.7),
      new CapWeightedActivationLedgerAdjuster(25898),
      new TieredWeightedActivationLedgerAdjuster([982, 2303, 4790], [0.82, 1.06, 0.95]),
    ],
    [],
    2.5,
    57084.1,
  );
}
