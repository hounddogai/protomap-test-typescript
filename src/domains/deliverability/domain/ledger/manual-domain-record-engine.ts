import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualDomainRecord } from "./manual-domain-record.js";

/** One step of the manual domain record calculation. */
export interface ManualDomainRecordModifier {
  describe(): string;
  adjust(item: ManualDomainRecord, value: number): number;
}

export class ManualDomainRecordGraceDaysOffsetAdjuster implements ManualDomainRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ManualDomainRecord, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class FlaggedManualDomainRecordAdjuster implements ManualDomainRecordModifier {
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

  adjust(item: ManualDomainRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualDomainRecordAdjuster implements ManualDomainRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualDomainRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitManualDomainRecordAdjuster implements ManualDomainRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ManualDomainRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual domain record steps in order and keeps a trace of each. */
export class ManualDomainRecordEngine {
  steps: ManualDomainRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualDomainRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualDomainRecord): number {
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

  evaluateAll(items: ManualDomainRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualDomainRecordEngine(flagsValue: flags.Registry): ManualDomainRecordEngine {
  return new ManualDomainRecordEngine(
    [
      new ManualDomainRecordGraceDaysOffsetAdjuster(1.75),
      new FlaggedManualDomainRecordAdjuster(flagsValue, "manual-domain-record-capped", -0.7),
      new MinimumManualDomainRecordAdjuster(5.4),
      new UnitManualDomainRecordAdjuster(new Map<string, number>([["retail", 1.17], ["central", 1.14]])),
    ],
    [],
    2.9,
    21630.6,
  );
}
