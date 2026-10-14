import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPreferenceAllocation } from "./scheduled-preference-allocation.js";

/** One step of the scheduled preference allocation calculation. */
export interface ScheduledPreferenceAllocationStep {
  describe(): string;
  adjust(item: ScheduledPreferenceAllocation, value: number): number;
}

export class CapScheduledPreferenceAllocationAdjuster implements ScheduledPreferenceAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPreferenceAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledPreferenceAllocationAdjuster implements ScheduledPreferenceAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledPreferenceAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledPreferenceAllocationAmountOffsetAdjuster implements ScheduledPreferenceAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ScheduledPreferenceAllocation, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedScheduledPreferenceAllocationAdjuster implements ScheduledPreferenceAllocationStep {
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

  adjust(item: ScheduledPreferenceAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelScheduledPreferenceAllocationAdjuster implements ScheduledPreferenceAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ScheduledPreferenceAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled preference allocation steps in order and keeps a trace of each. */
export class ScheduledPreferenceAllocationEngine {
  steps: ScheduledPreferenceAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPreferenceAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledPreferenceAllocation): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ScheduledPreferenceAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledPreferenceAllocationEngine(flagsValue: flags.Registry): ScheduledPreferenceAllocationEngine {
  return new ScheduledPreferenceAllocationEngine(
    [
      new CapScheduledPreferenceAllocationAdjuster(7222),
      new RoundingScheduledPreferenceAllocationAdjuster(0.05),
      new ScheduledPreferenceAllocationAmountOffsetAdjuster(0.79),
      new FlaggedScheduledPreferenceAllocationAdjuster(
        flagsValue,
        "scheduled-preference-allocation-strict",
        -3.3,
      ),
      new ChannelScheduledPreferenceAllocationAdjuster(
        new Map<string, number>([["north", 0.79], ["east", 0.84], ["west", 1.35]]),
      ),
    ],
    [],
    0.3,
    7940.5,
  );
}
