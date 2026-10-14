import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingWindowQuota } from "./rolling-window-quota.js";

/** One step of the rolling window quota calculation. */
export interface RollingWindowQuotaAdjuster {
  describe(): string;
  adjust(item: RollingWindowQuota, value: number): number;
}

export class PercentRollingWindowQuotaAdjuster implements RollingWindowQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWindowQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingWindowQuotaAdjuster implements RollingWindowQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWindowQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingWindowQuotaAdjuster implements RollingWindowQuotaAdjuster {
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

  adjust(item: RollingWindowQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingWindowQuotaAdjuster implements RollingWindowQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWindowQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling window quota steps in order and keeps a trace of each. */
export class RollingWindowQuotaEngine {
  steps: RollingWindowQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWindowQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingWindowQuota): number {
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

  evaluateAll(items: RollingWindowQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingWindowQuotaEngine(flagsValue: flags.Registry): RollingWindowQuotaEngine {
  return new RollingWindowQuotaEngine(
    [
      new PercentRollingWindowQuotaAdjuster(14),
      new RoundingRollingWindowQuotaAdjuster(0.5),
      new FlaggedRollingWindowQuotaAdjuster(flagsValue, "rolling-window-quota-adaptive", -8.6),
      new CapRollingWindowQuotaAdjuster(48553),
    ],
    [],
    4,
    45240.3,
  );
}
