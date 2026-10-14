import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredActivationRecord } from "./tiered-activation-record.js";

/** One step of the tiered activation record calculation. */
export interface TieredActivationRecordStep {
  describe(): string;
  adjust(item: TieredActivationRecord, value: number): number;
}

export class PercentTieredActivationRecordAdjuster implements TieredActivationRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredActivationRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredActivationRecordAdjuster implements TieredActivationRecordStep {
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

  adjust(item: TieredActivationRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceTieredActivationRecordAdjuster implements TieredActivationRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TieredActivationRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredActivationRecordAdjuster implements TieredActivationRecordStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredActivationRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTieredActivationRecordAdjuster implements TieredActivationRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredActivationRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered activation record steps in order and keeps a trace of each. */
export class TieredActivationRecordEngine {
  steps: TieredActivationRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredActivationRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredActivationRecord): number {
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

  evaluateAll(items: TieredActivationRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredActivationRecordEngine(flagsValue: flags.Registry): TieredActivationRecordEngine {
  return new TieredActivationRecordEngine(
    [
      new PercentTieredActivationRecordAdjuster(1.3),
      new FlaggedTieredActivationRecordAdjuster(flagsValue, "tiered-activation-record-weighted", 2.2),
      new SourceTieredActivationRecordAdjuster(new Map<string, number>([["east", 1.15], ["north", 1.28]])),
      new TieredTieredActivationRecordAdjuster([6505, 7797], [0.88, 1.03]),
      new CapTieredActivationRecordAdjuster(34596),
    ],
    [],
    3.3,
    14174.2,
  );
}
