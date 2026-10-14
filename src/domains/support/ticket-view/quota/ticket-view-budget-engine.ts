import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewBudget } from "./ticket-view-budget.js";

/** One step of the ticket view budget calculation. */
export interface TicketViewBudgetFactor {
  describe(): string;
  adjust(item: TicketViewBudget, value: number): number;
}

export class FlaggedTicketViewBudgetAdjuster implements TicketViewBudgetFactor {
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

  adjust(item: TicketViewBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TicketViewBudgetCeilingOffsetAdjuster implements TicketViewBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: TicketViewBudget, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class SourceTicketViewBudgetAdjuster implements TicketViewBudgetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TicketViewBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTicketViewBudgetAdjuster implements TicketViewBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the ticket view budget steps in order and keeps a trace of each. */
export class TicketViewBudgetEngine {
  steps: TicketViewBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TicketViewBudget): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TicketViewBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTicketViewBudgetEngine(flagsValue: flags.Registry): TicketViewBudgetEngine {
  return new TicketViewBudgetEngine(
    [
      new FlaggedTicketViewBudgetAdjuster(flagsValue, "ticket-view-budget-adaptive", -6.3),
      new TicketViewBudgetCeilingOffsetAdjuster(0.2),
      new SourceTicketViewBudgetAdjuster(new Map<string, number>([["north", 0.97], ["south", 0.9]])),
      new MinimumTicketViewBudgetAdjuster(16.9),
    ],
    [],
    4,
    86152.3,
  );
}
