import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleAssignment } from "./exit-rule-assignment.js";

/** One step of the exit rule assignment calculation. */
export interface ExitRuleAssignmentStep {
  describe(): string;
  adjust(item: ExitRuleAssignment, value: number): number;
}

export class PercentExitRuleAssignmentAdjuster implements ExitRuleAssignmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleExitRuleAssignmentAdjuster implements ExitRuleAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ExitRuleAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedExitRuleAssignmentAdjuster implements ExitRuleAssignmentStep {
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

  adjust(item: ExitRuleAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingExitRuleAssignmentAdjuster implements ExitRuleAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredExitRuleAssignmentAdjuster implements ExitRuleAssignmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumExitRuleAssignmentAdjuster implements ExitRuleAssignmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the exit rule assignment steps in order and keeps a trace of each. */
export class ExitRuleAssignmentEngine {
  steps: ExitRuleAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleAssignment): number {
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

  evaluateAll(items: ExitRuleAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleAssignmentEngine(flagsValue: flags.Registry): ExitRuleAssignmentEngine {
  return new ExitRuleAssignmentEngine(
    [
      new PercentExitRuleAssignmentAdjuster(13.6),
      new TitleExitRuleAssignmentAdjuster(new Map<string, number>([["east", 1.15]])),
      new FlaggedExitRuleAssignmentAdjuster(flagsValue, "exit-rule-assignment-primary", 7.4),
      new RoundingExitRuleAssignmentAdjuster(0.25),
      new TieredExitRuleAssignmentAdjuster([2502, 3904], [0.81, 1.04]),
      new MinimumExitRuleAssignmentAdjuster(9.2),
    ],
    [],
    4.9,
    10663.1,
  );
}
