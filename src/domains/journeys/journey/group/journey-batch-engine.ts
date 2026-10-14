import * as numbers from "../../../../kit/numbers.js";
import { JourneyBatch } from "./journey-batch.js";

/** One step of the journey batch calculation. */
export interface JourneyBatchStep {
  describe(): string;
  adjust(item: JourneyBatch, value: number): number;
}

export class TieredJourneyBatchAdjuster implements JourneyBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class JourneyBatchVersionOffsetAdjuster implements JourneyBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: JourneyBatch, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentJourneyBatchAdjuster implements JourneyBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey batch steps in order and keeps a trace of each. */
export class JourneyBatchEngine {
  steps: JourneyBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: JourneyBatch): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: JourneyBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultJourneyBatchEngine(): JourneyBatchEngine {
  return new JourneyBatchEngine(
    [
      new TieredJourneyBatchAdjuster([5189, 5346, 8332, 8471], [1.08, 1.07, 1.19, 1.05]),
      new JourneyBatchVersionOffsetAdjuster(0.41),
      new PercentJourneyBatchAdjuster(22.4),
    ],
    [],
    1.2,
    74384.3,
  );
}
