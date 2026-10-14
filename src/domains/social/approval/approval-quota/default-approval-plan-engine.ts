import * as flags from "../../../../kit/flags.js";
import { DefaultApprovalPlan } from "./default-approval-plan.js";

/** One step of the default approval plan calculation. */
export interface DefaultApprovalPlanModifier {
  describe(): string;
  adjust(item: DefaultApprovalPlan, value: number): number;
}

export class FlaggedDefaultApprovalPlanAdjuster implements DefaultApprovalPlanModifier {
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

  adjust(item: DefaultApprovalPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DefaultApprovalPlanClicksOffsetAdjuster implements DefaultApprovalPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: DefaultApprovalPlan, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class CapDefaultApprovalPlanAdjuster implements DefaultApprovalPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultApprovalPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default approval plan steps in order and keeps a trace of each. */
export class DefaultApprovalPlanEngine {
  steps: DefaultApprovalPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultApprovalPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultApprovalPlan): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DefaultApprovalPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultApprovalPlanEngine(flagsValue: flags.Registry): DefaultApprovalPlanEngine {
  return new DefaultApprovalPlanEngine(
    [
      new FlaggedDefaultApprovalPlanAdjuster(flagsValue, "default-approval-plan-strict", -8.1),
      new DefaultApprovalPlanClicksOffsetAdjuster(1.04),
      new CapDefaultApprovalPlanAdjuster(26788),
    ],
    [],
    3,
    75865.6,
  );
}
