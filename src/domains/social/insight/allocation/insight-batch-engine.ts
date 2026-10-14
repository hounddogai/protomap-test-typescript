import * as numbers from "../../../../kit/numbers.js";
import { InsightBatch } from "./insight-batch.js";

/** One step of the insight batch calculation. */
export interface InsightBatchAdjuster {
  describe(): string;
  adjust(item: InsightBatch, value: number): number;
}

export class PercentInsightBatchAdjuster implements InsightBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInsightBatchAdjuster implements InsightBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredInsightBatchAdjuster implements InsightBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameInsightBatchAdjuster implements InsightBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: InsightBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapInsightBatchAdjuster implements InsightBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the insight batch steps in order and keeps a trace of each. */
export class InsightBatchEngine {
  steps: InsightBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightBatch): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: InsightBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightBatchEngine(): InsightBatchEngine {
  return new InsightBatchEngine(
    [
      new PercentInsightBatchAdjuster(-24.7),
      new RoundingInsightBatchAdjuster(0.5),
      new TieredInsightBatchAdjuster([1226, 6686, 9463], [1.15, 1.09, 1.18]),
      new NameInsightBatchAdjuster(new Map<string, number>([["retail", 1.2], ["west", 1.22], ["east", 1.33]])),
      new CapInsightBatchAdjuster(5776),
    ],
    [],
    0.6,
    39703.2,
  );
}
