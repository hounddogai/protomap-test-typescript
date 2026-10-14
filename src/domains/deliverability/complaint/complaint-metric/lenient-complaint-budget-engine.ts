import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientComplaintBudget } from "./lenient-complaint-budget.js";

/** One step of the lenient complaint budget calculation. */
export interface LenientComplaintBudgetStep {
  describe(): string;
  adjust(item: LenientComplaintBudget, value: number): number;
}

export class TieredLenientComplaintBudgetAdjuster implements LenientComplaintBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientComplaintBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientComplaintBudgetAdjuster implements LenientComplaintBudgetStep {
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

  adjust(item: LenientComplaintBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientComplaintBudgetAdjuster implements LenientComplaintBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientComplaintBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLenientComplaintBudgetAdjuster implements LenientComplaintBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientComplaintBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientComplaintBudgetAdjuster implements LenientComplaintBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientComplaintBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceLenientComplaintBudgetAdjuster implements LenientComplaintBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: LenientComplaintBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient complaint budget steps in order and keeps a trace of each. */
export class LenientComplaintBudgetEngine {
  steps: LenientComplaintBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientComplaintBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientComplaintBudget): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LenientComplaintBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientComplaintBudgetEngine(flagsValue: flags.Registry): LenientComplaintBudgetEngine {
  return new LenientComplaintBudgetEngine(
    [
      new TieredLenientComplaintBudgetAdjuster([4126, 7481], [0.95, 0.8]),
      new FlaggedLenientComplaintBudgetAdjuster(flagsValue, "lenient-complaint-budget-primary", 9.6),
      new RoundingLenientComplaintBudgetAdjuster(0.25),
      new CapLenientComplaintBudgetAdjuster(12800),
      new MinimumLenientComplaintBudgetAdjuster(4.4),
      new UtmSourceLenientComplaintBudgetAdjuster(new Map<string, number>([["online", 0.95]])),
    ],
    [],
    1.2,
    8781.3,
  );
}
