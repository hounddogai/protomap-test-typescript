import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCreditRollup } from "./scheduled-credit-rollup.js";

/** One step of the scheduled credit rollup calculation. */
export interface ScheduledCreditRollupStep {
  describe(): string;
  adjust(item: ScheduledCreditRollup, value: number): number;
}

export class FlaggedScheduledCreditRollupAdjuster implements ScheduledCreditRollupStep {
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

  adjust(item: ScheduledCreditRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledCreditRollupAdjuster implements ScheduledCreditRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCreditRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledCreditRollupAdjuster implements ScheduledCreditRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledCreditRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled credit rollup steps in order and keeps a trace of each. */
export class ScheduledCreditRollupEngine {
  steps: ScheduledCreditRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCreditRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledCreditRollup): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ScheduledCreditRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledCreditRollupEngine(flagsValue: flags.Registry): ScheduledCreditRollupEngine {
  return new ScheduledCreditRollupEngine(
    [
      new FlaggedScheduledCreditRollupAdjuster(flagsValue, "scheduled-credit-rollup-batched", 2.8),
      new CapScheduledCreditRollupAdjuster(15271),
      new PercentScheduledCreditRollupAdjuster(1.1),
    ],
    [],
    3,
    96136.9,
  );
}
