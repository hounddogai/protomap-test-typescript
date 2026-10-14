import * as flags from "../../../../kit/flags.js";
import { StepLedger } from "./step-ledger.js";

/** One step of the step ledger calculation. */
export interface StepLedgerStep {
  describe(): string;
  adjust(item: StepLedger, value: number): number;
}

export class CapStepLedgerAdjuster implements StepLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStepLedgerAdjuster implements StepLedgerStep {
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

  adjust(item: StepLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceStepLedgerAdjuster implements StepLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StepLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StepLedgerWeightOffsetAdjuster implements StepLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: StepLedger, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class TieredStepLedgerAdjuster implements StepLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the step ledger steps in order and keeps a trace of each. */
export class StepLedgerEngine {
  steps: StepLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepLedger): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StepLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepLedgerEngine(flagsValue: flags.Registry): StepLedgerEngine {
  return new StepLedgerEngine(
    [
      new CapStepLedgerAdjuster(26533),
      new FlaggedStepLedgerAdjuster(flagsValue, "step-ledger-lenient", -2.5),
      new UtmSourceStepLedgerAdjuster(new Map<string, number>([["east", 0.95]])),
      new StepLedgerWeightOffsetAdjuster(1.43),
      new TieredStepLedgerAdjuster([195, 9609, 9994], [0.9, 0.9, 1.01]),
    ],
    [],
    0.8,
    26104.3,
  );
}
