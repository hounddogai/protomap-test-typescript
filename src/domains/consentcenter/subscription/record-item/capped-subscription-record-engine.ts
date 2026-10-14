import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedSubscriptionRecord } from "./capped-subscription-record.js";

/** One step of the capped subscription record calculation. */
export interface CappedSubscriptionRecordAdjuster {
  describe(): string;
  adjust(item: CappedSubscriptionRecord, value: number): number;
}

export class CappedSubscriptionRecordImpressionsOffsetAdjuster implements CappedSubscriptionRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: CappedSubscriptionRecord, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class MinimumCappedSubscriptionRecordAdjuster implements CappedSubscriptionRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedSubscriptionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCappedSubscriptionRecordAdjuster implements CappedSubscriptionRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSubscriptionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedSubscriptionRecordAdjuster implements CappedSubscriptionRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedSubscriptionRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedSubscriptionRecordAdjuster implements CappedSubscriptionRecordAdjuster {
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

  adjust(item: CappedSubscriptionRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped subscription record steps in order and keeps a trace of each. */
export class CappedSubscriptionRecordEngine {
  steps: CappedSubscriptionRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSubscriptionRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedSubscriptionRecord): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CappedSubscriptionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedSubscriptionRecordEngine(flagsValue: flags.Registry): CappedSubscriptionRecordEngine {
  return new CappedSubscriptionRecordEngine(
    [
      new CappedSubscriptionRecordImpressionsOffsetAdjuster(0.19),
      new MinimumCappedSubscriptionRecordAdjuster(6.9),
      new CapCappedSubscriptionRecordAdjuster(29263),
      new RoundingCappedSubscriptionRecordAdjuster(1),
      new FlaggedCappedSubscriptionRecordAdjuster(flagsValue, "capped-subscription-record-pending", -5.2),
    ],
    [],
    3.4,
    97100.1,
  );
}
