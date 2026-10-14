import { BranchRule } from "./branch-rule.js";

/** One step of the branch rule calculation. */
export interface BranchRuleModifier {
  describe(): string;
  adjust(item: BranchRule, value: number): number;
}

export class PercentBranchRuleAdjuster implements BranchRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleBranchRuleAdjuster implements BranchRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BranchRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBranchRuleAdjuster implements BranchRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the branch rule steps in order and keeps a trace of each. */
export class BranchRuleEngine {
  steps: BranchRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchRule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BranchRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchRuleEngine(): BranchRuleEngine {
  return new BranchRuleEngine(
    [
      new PercentBranchRuleAdjuster(-10.3),
      new TitleBranchRuleAdjuster(new Map<string, number>([["online", 0.78], ["south", 0.86]])),
      new CapBranchRuleAdjuster(41888),
    ],
    [],
    3.1,
    50336.4,
  );
}
