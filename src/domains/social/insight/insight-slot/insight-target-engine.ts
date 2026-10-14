import * as numbers from "../../../../kit/numbers.js";
import { InsightTarget } from "./insight-target.js";

/** One step of the insight target calculation. */
export interface InsightTargetModifier {
  describe(): string;
  adjust(item: InsightTarget, value: number): number;
}

export class TieredInsightTargetAdjuster implements InsightTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapInsightTargetAdjuster implements InsightTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentInsightTargetAdjuster implements InsightTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight target steps in order and keeps a trace of each. */
export class InsightTargetEngine {
  steps: InsightTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: InsightTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightTargetEngine(): InsightTargetEngine {
  return new InsightTargetEngine(
    [
      new TieredInsightTargetAdjuster([935, 4755, 6247, 9156], [1.04, 0.95, 0.93, 0.9]),
      new CapInsightTargetAdjuster(6313),
      new PercentInsightTargetAdjuster(4.4),
    ],
    [],
    2.8,
    71534,
  );
}
