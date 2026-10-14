import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitBudget } from "./wait-budget.js";

/** One step of the wait budget calculation. */
export interface WaitBudgetAdjuster {
  describe(): string;
  adjust(item: WaitBudget, value: number): number;
}

export class ChannelWaitBudgetAdjuster implements WaitBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WaitBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWaitBudgetAdjuster implements WaitBudgetAdjuster {
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

  adjust(item: WaitBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WaitBudgetCapacityOffsetAdjuster implements WaitBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: WaitBudget, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class RoundingWaitBudgetAdjuster implements WaitBudgetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the wait budget steps in order and keeps a trace of each. */
export class WaitBudgetEngine {
  steps: WaitBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitBudget): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WaitBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitBudgetEngine(flagsValue: flags.Registry): WaitBudgetEngine {
  return new WaitBudgetEngine(
    [
      new ChannelWaitBudgetAdjuster(new Map<string, number>([["central", 1.11], ["north", 1], ["west", 1.15]])),
      new FlaggedWaitBudgetAdjuster(flagsValue, "wait-budget-manual", -2.8),
      new WaitBudgetCapacityOffsetAdjuster(0.19),
      new RoundingWaitBudgetAdjuster(0.05),
    ],
    [],
    1.3,
    48837.2,
  );
}
