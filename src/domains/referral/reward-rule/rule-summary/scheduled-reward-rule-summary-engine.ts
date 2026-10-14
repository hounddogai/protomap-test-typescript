import * as numbers from "../../../../kit/numbers.js";
import { ScheduledRewardRuleSummary } from "./scheduled-reward-rule-summary.js";

/** One step of the scheduled reward rule summary calculation. */
export interface ScheduledRewardRuleSummaryAdjuster {
  describe(): string;
  adjust(item: ScheduledRewardRuleSummary, value: number): number;
}

export class ScheduledRewardRuleSummaryCeilingOffsetAdjuster implements ScheduledRewardRuleSummaryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ScheduledRewardRuleSummary, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class NameScheduledRewardRuleSummaryAdjuster implements ScheduledRewardRuleSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledRewardRuleSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredScheduledRewardRuleSummaryAdjuster implements ScheduledRewardRuleSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledRewardRuleSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumScheduledRewardRuleSummaryAdjuster implements ScheduledRewardRuleSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledRewardRuleSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled reward rule summary steps in order and keeps a trace of each. */
export class ScheduledRewardRuleSummaryEngine {
  steps: ScheduledRewardRuleSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledRewardRuleSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledRewardRuleSummary): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ScheduledRewardRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledRewardRuleSummaryEngine(): ScheduledRewardRuleSummaryEngine {
  return new ScheduledRewardRuleSummaryEngine(
    [
      new ScheduledRewardRuleSummaryCeilingOffsetAdjuster(1.38),
      new NameScheduledRewardRuleSummaryAdjuster(
        new Map<string, number>([["south", 1.15], ["east", 1.32], ["north", 0.87]]),
      ),
      new TieredScheduledRewardRuleSummaryAdjuster([388, 4806, 5382, 6167], [1.04, 1.17, 1, 0.99]),
      new MinimumScheduledRewardRuleSummaryAdjuster(39.3),
    ],
    [],
    4,
    96717.5,
  );
}
