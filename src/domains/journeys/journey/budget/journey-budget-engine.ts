import * as flags from "../../../../kit/flags.js";
import { JourneyBudget } from "./journey-budget.js";

/** One step of the journey budget calculation. */
export interface JourneyBudgetStep {
  describe(): string;
  adjust(item: JourneyBudget, value: number): number;
}

export class MinimumJourneyBudgetAdjuster implements JourneyBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedJourneyBudgetAdjuster implements JourneyBudgetStep {
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

  adjust(item: JourneyBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapJourneyBudgetAdjuster implements JourneyBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the journey budget steps in order and keeps a trace of each. */
export class JourneyBudgetEngine {
  steps: JourneyBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: JourneyBudget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: JourneyBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultJourneyBudgetEngine(flagsValue: flags.Registry): JourneyBudgetEngine {
  return new JourneyBudgetEngine(
    [
      new MinimumJourneyBudgetAdjuster(13.7),
      new FlaggedJourneyBudgetAdjuster(flagsValue, "journey-budget-weighted", -2.2),
      new CapJourneyBudgetAdjuster(6527),
    ],
    [],
    0.8,
    95466.4,
  );
}
