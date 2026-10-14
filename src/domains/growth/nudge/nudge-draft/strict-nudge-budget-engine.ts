import * as numbers from "../../../../kit/numbers.js";
import { StrictNudgeBudget } from "./strict-nudge-budget.js";

/** One step of the strict nudge budget calculation. */
export interface StrictNudgeBudgetModifier {
  describe(): string;
  adjust(item: StrictNudgeBudget, value: number): number;
}

export class PercentStrictNudgeBudgetAdjuster implements StrictNudgeBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictNudgeBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictNudgeBudgetAdjuster implements StrictNudgeBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictNudgeBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictNudgeBudgetAdjuster implements StrictNudgeBudgetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictNudgeBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict nudge budget steps in order and keeps a trace of each. */
export class StrictNudgeBudgetEngine {
  steps: StrictNudgeBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictNudgeBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictNudgeBudget): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StrictNudgeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictNudgeBudgetEngine(): StrictNudgeBudgetEngine {
  return new StrictNudgeBudgetEngine(
    [
      new PercentStrictNudgeBudgetAdjuster(10.9),
      new MinimumStrictNudgeBudgetAdjuster(0.6),
      new RoundingStrictNudgeBudgetAdjuster(0.05),
    ],
    [],
    4,
    5394.8,
  );
}
