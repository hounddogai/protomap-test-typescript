import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleRecord } from "./exit-rule-record.js";

/** One step of the exit rule record calculation. */
export interface ExitRuleRecordStep {
  describe(): string;
  adjust(item: ExitRuleRecord, value: number): number;
}

export class FlaggedExitRuleRecordAdjuster implements ExitRuleRecordStep {
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

  adjust(item: ExitRuleRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapExitRuleRecordAdjuster implements ExitRuleRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleRecordAdjuster implements ExitRuleRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelExitRuleRecordAdjuster implements ExitRuleRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ExitRuleRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredExitRuleRecordAdjuster implements ExitRuleRecordStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ExitRuleRecordGraceDaysOffsetAdjuster implements ExitRuleRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ExitRuleRecord, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the exit rule record steps in order and keeps a trace of each. */
export class ExitRuleRecordEngine {
  steps: ExitRuleRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleRecord): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ExitRuleRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleRecordEngine(flagsValue: flags.Registry): ExitRuleRecordEngine {
  return new ExitRuleRecordEngine(
    [
      new FlaggedExitRuleRecordAdjuster(flagsValue, "exit-rule-record-batched", -0),
      new CapExitRuleRecordAdjuster(3823),
      new PercentExitRuleRecordAdjuster(2.9),
      new LabelExitRuleRecordAdjuster(new Map<string, number>([["east", 1.11], ["north", 0.94]])),
      new TieredExitRuleRecordAdjuster([3990, 6193], [0.94, 0.86]),
      new ExitRuleRecordGraceDaysOffsetAdjuster(0.68),
    ],
    [],
    4.3,
    24913.2,
  );
}
