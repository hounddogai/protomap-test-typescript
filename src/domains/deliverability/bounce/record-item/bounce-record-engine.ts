import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceRecord } from "./bounce-record.js";

/** One step of the bounce record calculation. */
export interface BounceRecordStep {
  describe(): string;
  adjust(item: BounceRecord, value: number): number;
}

export class SourceBounceRecordAdjuster implements BounceRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BounceRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBounceRecordAdjuster implements BounceRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBounceRecordAdjuster implements BounceRecordStep {
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

  adjust(item: BounceRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBounceRecordAdjuster implements BounceRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBounceRecordAdjuster implements BounceRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the bounce record steps in order and keeps a trace of each. */
export class BounceRecordEngine {
  steps: BounceRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BounceRecord): number {
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

  evaluateAll(items: BounceRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBounceRecordEngine(flagsValue: flags.Registry): BounceRecordEngine {
  return new BounceRecordEngine(
    [
      new SourceBounceRecordAdjuster(new Map<string, number>([["online", 0.75], ["south", 1.25]])),
      new MinimumBounceRecordAdjuster(39.9),
      new FlaggedBounceRecordAdjuster(flagsValue, "bounce-record-scheduled", -1.2),
      new CapBounceRecordAdjuster(16203),
      new RoundingBounceRecordAdjuster(0.1),
    ],
    [],
    3.2,
    98616.1,
  );
}
