import * as flags from "../../../../kit/flags.js";
import { StepRecord } from "./step-record.js";

/** One step of the step record calculation. */
export interface StepRecordModifier {
  describe(): string;
  adjust(item: StepRecord, value: number): number;
}

export class UtmSourceStepRecordAdjuster implements StepRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StepRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStepRecordAdjuster implements StepRecordModifier {
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

  adjust(item: StepRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStepRecordAdjuster implements StepRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStepRecordAdjuster implements StepRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the step record steps in order and keeps a trace of each. */
export class StepRecordEngine {
  steps: StepRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StepRecord): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: StepRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStepRecordEngine(flagsValue: flags.Registry): StepRecordEngine {
  return new StepRecordEngine(
    [
      new UtmSourceStepRecordAdjuster(
        new Map<string, number>([["retail", 0.82], ["east", 1.34], ["central", 1.38]]),
      ),
      new FlaggedStepRecordAdjuster(flagsValue, "step-record-rolling", -5.9),
      new CapStepRecordAdjuster(19788),
      new TieredStepRecordAdjuster([2527, 4893, 7863], [1.09, 1.09, 0.87]),
    ],
    [],
    2.9,
    19099.9,
  );
}
