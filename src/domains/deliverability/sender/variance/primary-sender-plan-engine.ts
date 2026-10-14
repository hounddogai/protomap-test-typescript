import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimarySenderPlan } from "./primary-sender-plan.js";

/** One step of the primary sender plan calculation. */
export interface PrimarySenderPlanFactor {
  describe(): string;
  adjust(item: PrimarySenderPlan, value: number): number;
}

export class RoundingPrimarySenderPlanAdjuster implements PrimarySenderPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySenderPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimarySenderPlanAdjuster implements PrimarySenderPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySenderPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimarySenderPlanWeightOffsetAdjuster implements PrimarySenderPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: PrimarySenderPlan, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class FlaggedPrimarySenderPlanAdjuster implements PrimarySenderPlanFactor {
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

  adjust(item: PrimarySenderPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary sender plan steps in order and keeps a trace of each. */
export class PrimarySenderPlanEngine {
  steps: PrimarySenderPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySenderPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimarySenderPlan): number {
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

  evaluateAll(items: PrimarySenderPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimarySenderPlanEngine(flagsValue: flags.Registry): PrimarySenderPlanEngine {
  return new PrimarySenderPlanEngine(
    [
      new RoundingPrimarySenderPlanAdjuster(0.5),
      new CapPrimarySenderPlanAdjuster(32255),
      new PrimarySenderPlanWeightOffsetAdjuster(0.26),
      new FlaggedPrimarySenderPlanAdjuster(flagsValue, "primary-sender-plan-fallback", -8.5),
    ],
    [],
    2.1,
    64328.7,
  );
}
