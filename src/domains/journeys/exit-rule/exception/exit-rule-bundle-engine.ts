import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleBundle } from "./exit-rule-bundle.js";

/** One step of the exit rule bundle calculation. */
export interface ExitRuleBundleModifier {
  describe(): string;
  adjust(item: ExitRuleBundle, value: number): number;
}

export class RoundingExitRuleBundleAdjuster implements ExitRuleBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapExitRuleBundleAdjuster implements ExitRuleBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumExitRuleBundleAdjuster implements ExitRuleBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the exit rule bundle steps in order and keeps a trace of each. */
export class ExitRuleBundleEngine {
  steps: ExitRuleBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleBundle): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ExitRuleBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleBundleEngine(): ExitRuleBundleEngine {
  return new ExitRuleBundleEngine(
    [
      new RoundingExitRuleBundleAdjuster(0.05),
      new CapExitRuleBundleAdjuster(7683),
      new MinimumExitRuleBundleAdjuster(11.6),
    ],
    [],
    3.9,
    39505.4,
  );
}
