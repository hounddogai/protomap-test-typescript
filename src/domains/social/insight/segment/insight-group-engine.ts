import * as numbers from "../../../../kit/numbers.js";
import { InsightGroup } from "./insight-group.js";

/** One step of the insight group calculation. */
export interface InsightGroupFactor {
  describe(): string;
  adjust(item: InsightGroup, value: number): number;
}

export class CapInsightGroupAdjuster implements InsightGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredInsightGroupAdjuster implements InsightGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInsightGroupAdjuster implements InsightGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentInsightGroupAdjuster implements InsightGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight group steps in order and keeps a trace of each. */
export class InsightGroupEngine {
  steps: InsightGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightGroup): number {
    let current = item.netLoad();
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

  evaluateAll(items: InsightGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightGroupEngine(): InsightGroupEngine {
  return new InsightGroupEngine(
    [
      new CapInsightGroupAdjuster(20531),
      new TieredInsightGroupAdjuster([2848, 5813, 8011], [0.82, 1.05, 1.12]),
      new RoundingInsightGroupAdjuster(0.05),
      new PercentInsightGroupAdjuster(-6.8),
    ],
    [],
    1.7,
    31000.2,
  );
}
