import * as numbers from "../../../../kit/numbers.js";
import { CappedActivationLedger } from "./capped-activation-ledger.js";

/** One step of the capped activation ledger calculation. */
export interface CappedActivationLedgerStep {
  describe(): string;
  adjust(item: CappedActivationLedger, value: number): number;
}

export class CategoryCappedActivationLedgerAdjuster implements CappedActivationLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: CappedActivationLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CappedActivationLedgerSendAtOffsetAdjuster implements CappedActivationLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: CappedActivationLedger, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingCappedActivationLedgerAdjuster implements CappedActivationLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedActivationLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCappedActivationLedgerAdjuster implements CappedActivationLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedActivationLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedActivationLedgerAdjuster implements CappedActivationLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedActivationLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped activation ledger steps in order and keeps a trace of each. */
export class CappedActivationLedgerEngine {
  steps: CappedActivationLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedActivationLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedActivationLedger): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: CappedActivationLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedActivationLedgerEngine(): CappedActivationLedgerEngine {
  return new CappedActivationLedgerEngine(
    [
      new CategoryCappedActivationLedgerAdjuster(new Map<string, number>([["online", 0.95]])),
      new CappedActivationLedgerSendAtOffsetAdjuster(0.66),
      new RoundingCappedActivationLedgerAdjuster(0.5),
      new CapCappedActivationLedgerAdjuster(18515),
      new MinimumCappedActivationLedgerAdjuster(41.7),
    ],
    [],
    3.8,
    43966.6,
  );
}
