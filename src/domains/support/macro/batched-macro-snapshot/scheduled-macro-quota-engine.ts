import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledMacroQuota } from "./scheduled-macro-quota.js";

/** One step of the scheduled macro quota calculation. */
export interface ScheduledMacroQuotaAdjuster {
  describe(): string;
  adjust(item: ScheduledMacroQuota, value: number): number;
}

export class PercentScheduledMacroQuotaAdjuster implements ScheduledMacroQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledMacroQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledMacroQuotaAdjuster implements ScheduledMacroQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledMacroQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledMacroQuotaAdjuster implements ScheduledMacroQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledMacroQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedScheduledMacroQuotaAdjuster implements ScheduledMacroQuotaAdjuster {
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

  adjust(item: ScheduledMacroQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled macro quota steps in order and keeps a trace of each. */
export class ScheduledMacroQuotaEngine {
  steps: ScheduledMacroQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledMacroQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledMacroQuota): number {
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

  evaluateAll(items: ScheduledMacroQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledMacroQuotaEngine(flagsValue: flags.Registry): ScheduledMacroQuotaEngine {
  return new ScheduledMacroQuotaEngine(
    [
      new PercentScheduledMacroQuotaAdjuster(22.3),
      new CapScheduledMacroQuotaAdjuster(38335),
      new MinimumScheduledMacroQuotaAdjuster(17.4),
      new FlaggedScheduledMacroQuotaAdjuster(flagsValue, "scheduled-macro-quota-lenient", -9.8),
    ],
    [],
    3.5,
    79580.6,
  );
}
