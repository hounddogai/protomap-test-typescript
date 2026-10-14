import * as numbers from "../../../../kit/numbers.js";
import { InsightRollup } from "./insight-rollup.js";

/** One step of the insight rollup calculation. */
export interface InsightRollupAdjuster {
  describe(): string;
  adjust(item: InsightRollup, value: number): number;
}

export class InsightRollupCapacityOffsetAdjuster implements InsightRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: InsightRollup, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class RoundingInsightRollupAdjuster implements InsightRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentInsightRollupAdjuster implements InsightRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight rollup steps in order and keeps a trace of each. */
export class InsightRollupEngine {
  steps: InsightRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightRollup): number {
    let current = item.netExposure();
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

  evaluateAll(items: InsightRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightRollupEngine(): InsightRollupEngine {
  return new InsightRollupEngine(
    [
      new InsightRollupCapacityOffsetAdjuster(1.35),
      new RoundingInsightRollupAdjuster(0.05),
      new PercentInsightRollupAdjuster(23.8),
    ],
    [],
    2.5,
    73368.6,
  );
}
