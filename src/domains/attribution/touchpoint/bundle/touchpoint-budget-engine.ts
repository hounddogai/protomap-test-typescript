import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TouchpointBudget } from "./touchpoint-budget.js";

/** One step of the touchpoint budget calculation. */
export interface TouchpointBudgetModifier {
  describe(): string;
  adjust(item: TouchpointBudget, value: number): number;
}

export class PercentTouchpointBudgetAdjuster implements TouchpointBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTouchpointBudgetAdjuster implements TouchpointBudgetModifier {
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

  adjust(item: TouchpointBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTouchpointBudgetAdjuster implements TouchpointBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelTouchpointBudgetAdjuster implements TouchpointBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TouchpointBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the touchpoint budget steps in order and keeps a trace of each. */
export class TouchpointBudgetEngine {
  steps: TouchpointBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TouchpointBudget): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: TouchpointBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTouchpointBudgetEngine(flagsValue: flags.Registry): TouchpointBudgetEngine {
  return new TouchpointBudgetEngine(
    [
      new PercentTouchpointBudgetAdjuster(-14.4),
      new FlaggedTouchpointBudgetAdjuster(flagsValue, "touchpoint-budget-adaptive", -6.4),
      new CapTouchpointBudgetAdjuster(16719),
      new ChannelTouchpointBudgetAdjuster(new Map<string, number>([["retail", 1.17]])),
    ],
    [],
    0.5,
    36196.4,
  );
}
