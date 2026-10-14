import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationBudget } from "./activation-budget.js";

/** One step of the activation budget calculation. */
export interface ActivationBudgetFactor {
  describe(): string;
  adjust(item: ActivationBudget, value: number): number;
}

export class FlaggedActivationBudgetAdjuster implements ActivationBudgetFactor {
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

  adjust(item: ActivationBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapActivationBudgetAdjuster implements ActivationBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingActivationBudgetAdjuster implements ActivationBudgetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ActivationBudgetCeilingOffsetAdjuster implements ActivationBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ActivationBudget, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class TieredActivationBudgetAdjuster implements ActivationBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentActivationBudgetAdjuster implements ActivationBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the activation budget steps in order and keeps a trace of each. */
export class ActivationBudgetEngine {
  steps: ActivationBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ActivationBudget): number {
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

  evaluateAll(items: ActivationBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultActivationBudgetEngine(flagsValue: flags.Registry): ActivationBudgetEngine {
  return new ActivationBudgetEngine(
    [
      new FlaggedActivationBudgetAdjuster(flagsValue, "activation-budget-default", -2.6),
      new CapActivationBudgetAdjuster(13915),
      new RoundingActivationBudgetAdjuster(0.25),
      new ActivationBudgetCeilingOffsetAdjuster(1.52),
      new TieredActivationBudgetAdjuster([139, 1376, 5025, 8156], [0.84, 1.2, 1.13, 0.81]),
      new PercentActivationBudgetAdjuster(2.4),
    ],
    [],
    2.2,
    21238,
  );
}
