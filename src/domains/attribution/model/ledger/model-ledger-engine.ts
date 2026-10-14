import * as flags from "../../../../kit/flags.js";
import { ModelLedger } from "./model-ledger.js";

/** One step of the model ledger calculation. */
export interface ModelLedgerModifier {
  describe(): string;
  adjust(item: ModelLedger, value: number): number;
}

export class FlaggedModelLedgerAdjuster implements ModelLedgerModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ModelLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumModelLedgerAdjuster implements ModelLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapModelLedgerAdjuster implements ModelLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelModelLedgerAdjuster implements ModelLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ModelLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the model ledger steps in order and keeps a trace of each. */
export class ModelLedgerEngine {
  steps: ModelLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelLedger): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ModelLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelLedgerEngine(flagsValue: flags.Registry): ModelLedgerEngine {
  return new ModelLedgerEngine(
    [
      new FlaggedModelLedgerAdjuster(flagsValue, "model-ledger-rolling", -6.2),
      new MinimumModelLedgerAdjuster(31),
      new CapModelLedgerAdjuster(15411),
      new LabelModelLedgerAdjuster(
        new Map<string, number>([["south", 0.84], ["retail", 0.73], ["central", 1.21]]),
      ),
    ],
    [],
    0.8,
    15478.7,
  );
}
