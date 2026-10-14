import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakQuota } from "./streak-quota.js";

/** One step of the streak quota calculation. */
export interface StreakQuotaModifier {
  describe(): string;
  adjust(item: StreakQuota, value: number): number;
}

export class FlaggedStreakQuotaAdjuster implements StreakQuotaModifier {
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

  adjust(item: StreakQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStreakQuotaAdjuster implements StreakQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakQuotaAdjuster implements StreakQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the streak quota steps in order and keeps a trace of each. */
export class StreakQuotaEngine {
  steps: StreakQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakQuota): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: StreakQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakQuotaEngine(flagsValue: flags.Registry): StreakQuotaEngine {
  return new StreakQuotaEngine(
    [
      new FlaggedStreakQuotaAdjuster(flagsValue, "streak-quota-capped", -5.3),
      new PercentStreakQuotaAdjuster(24.5),
      new CapStreakQuotaAdjuster(48919),
    ],
    [],
    3.3,
    40054.2,
  );
}
