import * as flags from "../../../../kit/flags.js";
import { PlacementBudget } from "./placement-budget.js";

/** One step of the placement budget calculation. */
export interface PlacementBudgetModifier {
  describe(): string;
  adjust(item: PlacementBudget, value: number): number;
}

export class FlaggedPlacementBudgetAdjuster implements PlacementBudgetModifier {
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

  adjust(item: PlacementBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPlacementBudgetAdjuster implements PlacementBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPlacementBudgetAdjuster implements PlacementBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PlacementBudgetAttemptsOffsetAdjuster implements PlacementBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: PlacementBudget, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapPlacementBudgetAdjuster implements PlacementBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitlePlacementBudgetAdjuster implements PlacementBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PlacementBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the placement budget steps in order and keeps a trace of each. */
export class PlacementBudgetEngine {
  steps: PlacementBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PlacementBudget): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PlacementBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPlacementBudgetEngine(flagsValue: flags.Registry): PlacementBudgetEngine {
  return new PlacementBudgetEngine(
    [
      new FlaggedPlacementBudgetAdjuster(flagsValue, "placement-budget-weighted", -7.3),
      new TieredPlacementBudgetAdjuster([7763, 9178], [1.03, 0.85]),
      new PercentPlacementBudgetAdjuster(3.3),
      new PlacementBudgetAttemptsOffsetAdjuster(0.49),
      new CapPlacementBudgetAdjuster(34581),
      new TitlePlacementBudgetAdjuster(new Map<string, number>([["south", 1.15]])),
    ],
    [],
    4.7,
    29971.9,
  );
}
