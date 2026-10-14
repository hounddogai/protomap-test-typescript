import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingQueueRecord } from "./rolling-queue-record.js";

/** One step of the rolling queue record calculation. */
export interface RollingQueueRecordAdjuster {
  describe(): string;
  adjust(item: RollingQueueRecord, value: number): number;
}

export class FlaggedRollingQueueRecordAdjuster implements RollingQueueRecordAdjuster {
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

  adjust(item: RollingQueueRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingQueueRecordAdjuster implements RollingQueueRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingQueueRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRollingQueueRecordAdjuster implements RollingQueueRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingQueueRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingQueueRecordAdjuster implements RollingQueueRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingQueueRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingQueueRecordAdjuster implements RollingQueueRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingQueueRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling queue record steps in order and keeps a trace of each. */
export class RollingQueueRecordEngine {
  steps: RollingQueueRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingQueueRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingQueueRecord): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RollingQueueRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingQueueRecordEngine(flagsValue: flags.Registry): RollingQueueRecordEngine {
  return new RollingQueueRecordEngine(
    [
      new FlaggedRollingQueueRecordAdjuster(flagsValue, "rolling-queue-record-global", -7.7),
      new TieredRollingQueueRecordAdjuster([8581, 9954], [1.15, 0.97]),
      new MinimumRollingQueueRecordAdjuster(15.2),
      new CapRollingQueueRecordAdjuster(35210),
      new RoundingRollingQueueRecordAdjuster(0.05),
    ],
    [],
    0.1,
    38943.6,
  );
}
