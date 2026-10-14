import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledEnrollmentQuota } from "./scheduled-enrollment-quota.js";

/** One step of the scheduled enrollment quota calculation. */
export interface ScheduledEnrollmentQuotaStep {
  describe(): string;
  adjust(item: ScheduledEnrollmentQuota, value: number): number;
}

export class TieredScheduledEnrollmentQuotaAdjuster implements ScheduledEnrollmentQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledEnrollmentQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledEnrollmentQuotaAdjuster implements ScheduledEnrollmentQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledEnrollmentQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedScheduledEnrollmentQuotaAdjuster implements ScheduledEnrollmentQuotaStep {
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

  adjust(item: ScheduledEnrollmentQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled enrollment quota steps in order and keeps a trace of each. */
export class ScheduledEnrollmentQuotaEngine {
  steps: ScheduledEnrollmentQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledEnrollmentQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledEnrollmentQuota): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ScheduledEnrollmentQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledEnrollmentQuotaEngine(flagsValue: flags.Registry): ScheduledEnrollmentQuotaEngine {
  return new ScheduledEnrollmentQuotaEngine(
    [
      new TieredScheduledEnrollmentQuotaAdjuster([1777, 3659, 7666], [1.17, 1.06, 0.82]),
      new RoundingScheduledEnrollmentQuotaAdjuster(0.05),
      new FlaggedScheduledEnrollmentQuotaAdjuster(flagsValue, "scheduled-enrollment-quota-capped", 1.7),
    ],
    [],
    1.6,
    48814.9,
  );
}
