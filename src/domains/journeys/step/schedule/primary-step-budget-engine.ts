import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryStepBudget } from "./primary-step-budget.js";

/** One step of the primary step budget calculation. */
export interface PrimaryStepBudgetModifier {
  describe(): string;
  adjust(item: PrimaryStepBudget, value: number): number;
}

export class PrimaryStepBudgetBudgetOffsetAdjuster implements PrimaryStepBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PrimaryStepBudget, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingPrimaryStepBudgetAdjuster implements PrimaryStepBudgetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryStepBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPrimaryStepBudgetAdjuster implements PrimaryStepBudgetModifier {
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

  adjust(item: PrimaryStepBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary step budget steps in order and keeps a trace of each. */
export class PrimaryStepBudgetEngine {
  steps: PrimaryStepBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryStepBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryStepBudget): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PrimaryStepBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryStepBudgetEngine(flagsValue: flags.Registry): PrimaryStepBudgetEngine {
  return new PrimaryStepBudgetEngine(
    [
      new PrimaryStepBudgetBudgetOffsetAdjuster(0.56),
      new RoundingPrimaryStepBudgetAdjuster(1),
      new FlaggedPrimaryStepBudgetAdjuster(flagsValue, "primary-step-budget-tiered", 5.4),
    ],
    [],
    3.5,
    39518.3,
  );
}
