import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingQueueAdjustment } from "./rolling-queue-adjustment.js";

/** One step of the rolling queue adjustment calculation. */
export interface RollingQueueAdjustmentStep {
  describe(): string;
  adjust(item: RollingQueueAdjustment, value: number): number;
}

export class FlaggedRollingQueueAdjustmentAdjuster implements RollingQueueAdjustmentStep {
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

  adjust(item: RollingQueueAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingQueueAdjustmentAdjuster implements RollingQueueAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingQueueAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingQueueAdjustmentAdjuster implements RollingQueueAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingQueueAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling queue adjustment steps in order and keeps a trace of each. */
export class RollingQueueAdjustmentEngine {
  steps: RollingQueueAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingQueueAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingQueueAdjustment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RollingQueueAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingQueueAdjustmentEngine(flagsValue: flags.Registry): RollingQueueAdjustmentEngine {
  return new RollingQueueAdjustmentEngine(
    [
      new FlaggedRollingQueueAdjustmentAdjuster(flagsValue, "rolling-queue-adjustment-rolling", 3.5),
      new MinimumRollingQueueAdjustmentAdjuster(41.1),
      new CapRollingQueueAdjustmentAdjuster(37249),
    ],
    [],
    2.1,
    78577.9,
  );
}
