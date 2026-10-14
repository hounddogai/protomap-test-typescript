import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

/** One step of the scheduled deflection record calculation. */
export interface ScheduledDeflectionRecordModifier {
  describe(): string;
  adjust(item: ScheduledDeflectionRecord, value: number): number;
}

export class ScheduledDeflectionRecordRetriesOffsetAdjuster implements ScheduledDeflectionRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ScheduledDeflectionRecord, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredScheduledDeflectionRecordAdjuster implements ScheduledDeflectionRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledDeflectionRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledDeflectionRecordAdjuster implements ScheduledDeflectionRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledDeflectionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedScheduledDeflectionRecordAdjuster implements ScheduledDeflectionRecordModifier {
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

  adjust(item: ScheduledDeflectionRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelScheduledDeflectionRecordAdjuster implements ScheduledDeflectionRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledDeflectionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledDeflectionRecordAdjuster implements ScheduledDeflectionRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledDeflectionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled deflection record steps in order and keeps a trace of each. */
export class ScheduledDeflectionRecordEngine {
  steps: ScheduledDeflectionRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDeflectionRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledDeflectionRecord): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ScheduledDeflectionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledDeflectionRecordEngine(flagsValue: flags.Registry): ScheduledDeflectionRecordEngine {
  return new ScheduledDeflectionRecordEngine(
    [
      new ScheduledDeflectionRecordRetriesOffsetAdjuster(1.38),
      new TieredScheduledDeflectionRecordAdjuster([2203, 7133, 9702], [1.07, 0.81, 0.88]),
      new CapScheduledDeflectionRecordAdjuster(28074),
      new FlaggedScheduledDeflectionRecordAdjuster(flagsValue, "scheduled-deflection-record-default", -8.1),
      new LabelScheduledDeflectionRecordAdjuster(new Map<string, number>([["west", 1.25], ["east", 1.4]])),
      new PercentScheduledDeflectionRecordAdjuster(3.3),
    ],
    [],
    1.4,
    88378.5,
  );
}
