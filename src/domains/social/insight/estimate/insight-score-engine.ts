import * as numbers from "../../../../kit/numbers.js";
import { InsightScore } from "./insight-score.js";

/** One step of the insight score calculation. */
export interface InsightScoreStep {
  describe(): string;
  adjust(item: InsightScore, value: number): number;
}

export class UnitInsightScoreAdjuster implements InsightScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: InsightScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumInsightScoreAdjuster implements InsightScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentInsightScoreAdjuster implements InsightScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight score steps in order and keeps a trace of each. */
export class InsightScoreEngine {
  steps: InsightScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightScore): number {
    let current = item.netLoad();
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

  evaluateAll(items: InsightScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightScoreEngine(): InsightScoreEngine {
  return new InsightScoreEngine(
    [
      new UnitInsightScoreAdjuster(new Map<string, number>([["online", 1.36], ["retail", 0.74]])),
      new MinimumInsightScoreAdjuster(25.2),
      new PercentInsightScoreAdjuster(-4.8),
    ],
    [],
    2.1,
    91408.7,
  );
}
