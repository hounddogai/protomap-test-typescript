import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingQueueTarget } from "./rolling-queue-target.js";

/** One step of the rolling queue target calculation. */
export interface RollingQueueTargetFactor {
  describe(): string;
  adjust(item: RollingQueueTarget, value: number): number;
}

export class RoundingRollingQueueTargetAdjuster implements RollingQueueTargetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingQueueTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingQueueTargetAdjuster implements RollingQueueTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingQueueTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRollingQueueTargetAdjuster implements RollingQueueTargetFactor {
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

  adjust(item: RollingQueueTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingQueueTargetAdjuster implements RollingQueueTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingQueueTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingQueueTargetAdjuster implements RollingQueueTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingQueueTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingQueueTargetBatchSizeOffsetAdjuster implements RollingQueueTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: RollingQueueTarget, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the rolling queue target steps in order and keeps a trace of each. */
export class RollingQueueTargetEngine {
  steps: RollingQueueTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingQueueTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingQueueTarget): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RollingQueueTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingQueueTargetEngine(flagsValue: flags.Registry): RollingQueueTargetEngine {
  return new RollingQueueTargetEngine(
    [
      new RoundingRollingQueueTargetAdjuster(0.25),
      new MinimumRollingQueueTargetAdjuster(7.1),
      new FlaggedRollingQueueTargetAdjuster(flagsValue, "rolling-queue-target-seasonal", -4.6),
      new PercentRollingQueueTargetAdjuster(17.6),
      new CapRollingQueueTargetAdjuster(31715),
      new RollingQueueTargetBatchSizeOffsetAdjuster(0.1),
    ],
    [],
    1,
    78750.6,
  );
}
