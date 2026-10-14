import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleSnapshot } from "./exit-rule-snapshot.js";

/** One step of the exit rule snapshot calculation. */
export interface ExitRuleSnapshotFactor {
  describe(): string;
  adjust(item: ExitRuleSnapshot, value: number): number;
}

export class NameExitRuleSnapshotAdjuster implements ExitRuleSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ExitRuleSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumExitRuleSnapshotAdjuster implements ExitRuleSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentExitRuleSnapshotAdjuster implements ExitRuleSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule snapshot steps in order and keeps a trace of each. */
export class ExitRuleSnapshotEngine {
  steps: ExitRuleSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleSnapshot): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ExitRuleSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleSnapshotEngine(): ExitRuleSnapshotEngine {
  return new ExitRuleSnapshotEngine(
    [
      new NameExitRuleSnapshotAdjuster(new Map<string, number>([["north", 0.77]])),
      new MinimumExitRuleSnapshotAdjuster(5.4),
      new PercentExitRuleSnapshotAdjuster(-20),
    ],
    [],
    4.2,
    92564.1,
  );
}
