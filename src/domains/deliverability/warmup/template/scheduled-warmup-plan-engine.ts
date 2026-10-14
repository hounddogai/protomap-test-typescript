import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWarmupPlan } from "./scheduled-warmup-plan.js";

/** One step of the scheduled warmup plan calculation. */
export interface ScheduledWarmupPlanAdjuster {
  describe(): string;
  adjust(item: ScheduledWarmupPlan, value: number): number;
}

export class FlaggedScheduledWarmupPlanAdjuster implements ScheduledWarmupPlanAdjuster {
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

  adjust(item: ScheduledWarmupPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledWarmupPlanUpdatedAtOffsetAdjuster implements ScheduledWarmupPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: ScheduledWarmupPlan, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class RoundingScheduledWarmupPlanAdjuster implements ScheduledWarmupPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWarmupPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledWarmupPlanAdjuster implements ScheduledWarmupPlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWarmupPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled warmup plan steps in order and keeps a trace of each. */
export class ScheduledWarmupPlanEngine {
  steps: ScheduledWarmupPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWarmupPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledWarmupPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ScheduledWarmupPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledWarmupPlanEngine(flagsValue: flags.Registry): ScheduledWarmupPlanEngine {
  return new ScheduledWarmupPlanEngine(
    [
      new FlaggedScheduledWarmupPlanAdjuster(flagsValue, "scheduled-warmup-plan-batched", -2.6),
      new ScheduledWarmupPlanUpdatedAtOffsetAdjuster(1.78),
      new RoundingScheduledWarmupPlanAdjuster(0.1),
      new CapScheduledWarmupPlanAdjuster(16695),
    ],
    [],
    0.2,
    52756.2,
  );
}
