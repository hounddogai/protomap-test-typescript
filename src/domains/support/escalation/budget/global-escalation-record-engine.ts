import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalEscalationRecord } from "./global-escalation-record.js";

/** One step of the global escalation record calculation. */
export interface GlobalEscalationRecordStep {
  describe(): string;
  adjust(item: GlobalEscalationRecord, value: number): number;
}

export class TieredGlobalEscalationRecordAdjuster implements GlobalEscalationRecordStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalEscalationRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalEscalationRecordAdjuster implements GlobalEscalationRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalEscalationRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentGlobalEscalationRecordAdjuster implements GlobalEscalationRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalEscalationRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalEscalationRecordAdjuster implements GlobalEscalationRecordStep {
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

  adjust(item: GlobalEscalationRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalEscalationRecordAdjuster implements GlobalEscalationRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalEscalationRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global escalation record steps in order and keeps a trace of each. */
export class GlobalEscalationRecordEngine {
  steps: GlobalEscalationRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalEscalationRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalEscalationRecord): number {
    let current = item.weightedValue();
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

  evaluateAll(items: GlobalEscalationRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalEscalationRecordEngine(flagsValue: flags.Registry): GlobalEscalationRecordEngine {
  return new GlobalEscalationRecordEngine(
    [
      new TieredGlobalEscalationRecordAdjuster([4176, 4673, 5025], [0.95, 1.09, 0.84]),
      new CapGlobalEscalationRecordAdjuster(20905),
      new PercentGlobalEscalationRecordAdjuster(-19.5),
      new FlaggedGlobalEscalationRecordAdjuster(flagsValue, "global-escalation-record-adaptive", 7.3),
      new RoundingGlobalEscalationRecordAdjuster(0.1),
    ],
    [],
    1.6,
    82432.8,
  );
}
