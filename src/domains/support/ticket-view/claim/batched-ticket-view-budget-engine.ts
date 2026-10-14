import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedTicketViewBudget } from "./batched-ticket-view-budget.js";

/** One step of the batched ticket view budget calculation. */
export interface BatchedTicketViewBudgetModifier {
  describe(): string;
  adjust(item: BatchedTicketViewBudget, value: number): number;
}

export class FlaggedBatchedTicketViewBudgetAdjuster implements BatchedTicketViewBudgetModifier {
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

  adjust(item: BatchedTicketViewBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedTicketViewBudgetDiscountOffsetAdjuster implements BatchedTicketViewBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: BatchedTicketViewBudget, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class TieredBatchedTicketViewBudgetAdjuster implements BatchedTicketViewBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedTicketViewBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelBatchedTicketViewBudgetAdjuster implements BatchedTicketViewBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedTicketViewBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched ticket view budget steps in order and keeps a trace of each. */
export class BatchedTicketViewBudgetEngine {
  steps: BatchedTicketViewBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTicketViewBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedTicketViewBudget): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedTicketViewBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedTicketViewBudgetEngine(flagsValue: flags.Registry): BatchedTicketViewBudgetEngine {
  return new BatchedTicketViewBudgetEngine(
    [
      new FlaggedBatchedTicketViewBudgetAdjuster(flagsValue, "batched-ticket-view-budget-global", 5.6),
      new BatchedTicketViewBudgetDiscountOffsetAdjuster(1),
      new TieredBatchedTicketViewBudgetAdjuster([6240, 8986, 9755], [0.96, 1.1, 0.82]),
      new LabelBatchedTicketViewBudgetAdjuster(
        new Map<string, number>([["south", 1.06], ["central", 1.22], ["west", 0.95]]),
      ),
    ],
    [],
    0.2,
    69978.9,
  );
}
