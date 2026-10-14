import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyPacingBudget } from "./legacy-pacing-budget.js";

/** One step of the legacy pacing budget calculation. */
export interface LegacyPacingBudgetAdjuster {
  describe(): string;
  adjust(item: LegacyPacingBudget, value: number): number;
}

export class RoundingLegacyPacingBudgetAdjuster implements LegacyPacingBudgetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPacingBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyPacingBudgetAdjuster implements LegacyPacingBudgetAdjuster {
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

  adjust(item: LegacyPacingBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyPacingBudgetAdjuster implements LegacyPacingBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPacingBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameLegacyPacingBudgetAdjuster implements LegacyPacingBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LegacyPacingBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyPacingBudgetAdjuster implements LegacyPacingBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPacingBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyPacingBudgetAdjuster implements LegacyPacingBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPacingBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy pacing budget steps in order and keeps a trace of each. */
export class LegacyPacingBudgetEngine {
  steps: LegacyPacingBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPacingBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyPacingBudget): number {
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

  evaluateAll(items: LegacyPacingBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyPacingBudgetEngine(flagsValue: flags.Registry): LegacyPacingBudgetEngine {
  return new LegacyPacingBudgetEngine(
    [
      new RoundingLegacyPacingBudgetAdjuster(0.25),
      new FlaggedLegacyPacingBudgetAdjuster(flagsValue, "legacy-pacing-budget-weighted", 4.5),
      new CapLegacyPacingBudgetAdjuster(21712),
      new NameLegacyPacingBudgetAdjuster(new Map<string, number>([["north", 0.78], ["south", 1.14]])),
      new PercentLegacyPacingBudgetAdjuster(-16.3),
      new MinimumLegacyPacingBudgetAdjuster(35.7),
    ],
    [],
    2,
    76002.6,
  );
}
