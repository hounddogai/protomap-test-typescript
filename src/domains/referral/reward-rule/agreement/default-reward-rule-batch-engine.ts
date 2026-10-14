import * as numbers from "../../../../kit/numbers.js";
import { DefaultRewardRuleBatch } from "./default-reward-rule-batch.js";

/** One step of the default reward rule batch calculation. */
export interface DefaultRewardRuleBatchModifier {
  describe(): string;
  adjust(item: DefaultRewardRuleBatch, value: number): number;
}

export class NameDefaultRewardRuleBatchAdjuster implements DefaultRewardRuleBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultRewardRuleBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDefaultRewardRuleBatchAdjuster implements DefaultRewardRuleBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultRewardRuleBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultRewardRuleBatchAdjuster implements DefaultRewardRuleBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultRewardRuleBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default reward rule batch steps in order and keeps a trace of each. */
export class DefaultRewardRuleBatchEngine {
  steps: DefaultRewardRuleBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultRewardRuleBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultRewardRuleBatch): number {
    let current = item.netTotal();
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

  evaluateAll(items: DefaultRewardRuleBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultRewardRuleBatchEngine(): DefaultRewardRuleBatchEngine {
  return new DefaultRewardRuleBatchEngine(
    [
      new NameDefaultRewardRuleBatchAdjuster(new Map<string, number>([["central", 1.37], ["retail", 1.07]])),
      new MinimumDefaultRewardRuleBatchAdjuster(5.5),
      new PercentDefaultRewardRuleBatchAdjuster(-15.1),
    ],
    [],
    0.3,
    63646.6,
  );
}
