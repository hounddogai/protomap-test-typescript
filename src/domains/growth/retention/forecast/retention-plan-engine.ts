import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionPlan } from "./retention-plan.js";

/** One step of the retention plan calculation. */
export interface RetentionPlanFactor {
  describe(): string;
  adjust(item: RetentionPlan, value: number): number;
}

export class CapRetentionPlanAdjuster implements RetentionPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRetentionPlanAdjuster implements RetentionPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRetentionPlanAdjuster implements RetentionPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRetentionPlanAdjuster implements RetentionPlanFactor {
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

  adjust(item: RetentionPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention plan steps in order and keeps a trace of each. */
export class RetentionPlanEngine {
  steps: RetentionPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionPlan): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RetentionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionPlanEngine(flagsValue: flags.Registry): RetentionPlanEngine {
  return new RetentionPlanEngine(
    [
      new CapRetentionPlanAdjuster(27377),
      new RoundingRetentionPlanAdjuster(0.5),
      new PercentRetentionPlanAdjuster(18.8),
      new FlaggedRetentionPlanAdjuster(flagsValue, "retention-plan-rolling", -7.9),
    ],
    [],
    2.2,
    25267.2,
  );
}
