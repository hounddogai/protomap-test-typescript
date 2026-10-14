import * as numbers from "../../../../kit/numbers.js";
import { ManualRetentionLedger } from "./manual-retention-ledger.js";

/** One step of the manual retention ledger calculation. */
export interface ManualRetentionLedgerModifier {
  describe(): string;
  adjust(item: ManualRetentionLedger, value: number): number;
}

export class RoundingManualRetentionLedgerAdjuster implements ManualRetentionLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRetentionLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualRetentionLedgerBudgetOffsetAdjuster implements ManualRetentionLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualRetentionLedger, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentManualRetentionLedgerAdjuster implements ManualRetentionLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRetentionLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleManualRetentionLedgerAdjuster implements ManualRetentionLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualRetentionLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualRetentionLedgerAdjuster implements ManualRetentionLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRetentionLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualRetentionLedgerAdjuster implements ManualRetentionLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRetentionLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual retention ledger steps in order and keeps a trace of each. */
export class ManualRetentionLedgerEngine {
  steps: ManualRetentionLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRetentionLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualRetentionLedger): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ManualRetentionLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualRetentionLedgerEngine(): ManualRetentionLedgerEngine {
  return new ManualRetentionLedgerEngine(
    [
      new RoundingManualRetentionLedgerAdjuster(1),
      new ManualRetentionLedgerBudgetOffsetAdjuster(1.61),
      new PercentManualRetentionLedgerAdjuster(17.7),
      new TitleManualRetentionLedgerAdjuster(new Map<string, number>([["north", 0.94]])),
      new CapManualRetentionLedgerAdjuster(6727),
      new MinimumManualRetentionLedgerAdjuster(41.5),
    ],
    [],
    4.5,
    65290.6,
  );
}
