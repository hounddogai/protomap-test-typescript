import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeBudget } from "./nudge-budget.js";

/** One step of the nudge budget calculation. */
export interface NudgeBudgetStep {
  describe(): string;
  adjust(item: NudgeBudget, value: number): number;
}

export class FlaggedNudgeBudgetAdjuster implements NudgeBudgetStep {
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

  adjust(item: NudgeBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleNudgeBudgetAdjuster implements NudgeBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: NudgeBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapNudgeBudgetAdjuster implements NudgeBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredNudgeBudgetAdjuster implements NudgeBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingNudgeBudgetAdjuster implements NudgeBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the nudge budget steps in order and keeps a trace of each. */
export class NudgeBudgetEngine {
  steps: NudgeBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: NudgeBudget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: NudgeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultNudgeBudgetEngine(flagsValue: flags.Registry): NudgeBudgetEngine {
  return new NudgeBudgetEngine(
    [
      new FlaggedNudgeBudgetAdjuster(flagsValue, "nudge-budget-pending", 3.3),
      new LocaleNudgeBudgetAdjuster(new Map<string, number>([["north", 1.34], ["online", 1.11]])),
      new CapNudgeBudgetAdjuster(32635),
      new TieredNudgeBudgetAdjuster([1624, 5815, 6099], [1.19, 1.02, 1.08]),
      new RoundingNudgeBudgetAdjuster(5),
    ],
    [],
    0.6,
    86810.6,
  );
}
