import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredEscalationRecord } from "./tiered-escalation-record.js";

/** One step of the tiered escalation record calculation. */
export interface TieredEscalationRecordStep {
  describe(): string;
  adjust(item: TieredEscalationRecord, value: number): number;
}

export class FlaggedTieredEscalationRecordAdjuster implements TieredEscalationRecordStep {
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

  adjust(item: TieredEscalationRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredEscalationRecordAdjuster implements TieredEscalationRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredEscalationRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredEscalationRecordAdjuster implements TieredEscalationRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredEscalationRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredEscalationRecordAdjuster implements TieredEscalationRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredEscalationRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredEscalationRecordAdjuster implements TieredEscalationRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredEscalationRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered escalation record steps in order and keeps a trace of each. */
export class TieredEscalationRecordEngine {
  steps: TieredEscalationRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredEscalationRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredEscalationRecord): number {
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

  evaluateAll(items: TieredEscalationRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredEscalationRecordEngine(flagsValue: flags.Registry): TieredEscalationRecordEngine {
  return new TieredEscalationRecordEngine(
    [
      new FlaggedTieredEscalationRecordAdjuster(flagsValue, "tiered-escalation-record-primary", -4.6),
      new CapTieredEscalationRecordAdjuster(48385),
      new PercentTieredEscalationRecordAdjuster(18.8),
      new MinimumTieredEscalationRecordAdjuster(18.7),
      new RoundingTieredEscalationRecordAdjuster(1),
    ],
    [],
    3.9,
    41385.8,
  );
}
