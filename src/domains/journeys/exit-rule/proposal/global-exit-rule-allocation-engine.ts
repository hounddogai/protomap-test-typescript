import * as flags from "../../../../kit/flags.js";
import { GlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

/** One step of the global exit rule allocation calculation. */
export interface GlobalExitRuleAllocationFactor {
  describe(): string;
  adjust(item: GlobalExitRuleAllocation, value: number): number;
}

export class GlobalExitRuleAllocationUpdatedAtOffsetAdjuster implements GlobalExitRuleAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: GlobalExitRuleAllocation, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentGlobalExitRuleAllocationAdjuster implements GlobalExitRuleAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalExitRuleAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalExitRuleAllocationAdjuster implements GlobalExitRuleAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalExitRuleAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalExitRuleAllocationAdjuster implements GlobalExitRuleAllocationFactor {
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

  adjust(item: GlobalExitRuleAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global exit rule allocation steps in order and keeps a trace of each. */
export class GlobalExitRuleAllocationEngine {
  steps: GlobalExitRuleAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalExitRuleAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalExitRuleAllocation): number {
    let current = item.netLoad();
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

  evaluateAll(items: GlobalExitRuleAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalExitRuleAllocationEngine(flagsValue: flags.Registry): GlobalExitRuleAllocationEngine {
  return new GlobalExitRuleAllocationEngine(
    [
      new GlobalExitRuleAllocationUpdatedAtOffsetAdjuster(1.41),
      new PercentGlobalExitRuleAllocationAdjuster(8.4),
      new CapGlobalExitRuleAllocationAdjuster(24095),
      new FlaggedGlobalExitRuleAllocationAdjuster(flagsValue, "global-exit-rule-allocation-rolling", 6.4),
    ],
    [],
    4.7,
    27579.6,
  );
}
