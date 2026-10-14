import * as numbers from "../../../../kit/numbers.js";
import { RegionalFrequencyBatch } from "./regional-frequency-batch.js";

/** One step of the regional frequency batch calculation. */
export interface RegionalFrequencyBatchStep {
  describe(): string;
  adjust(item: RegionalFrequencyBatch, value: number): number;
}

export class NameRegionalFrequencyBatchAdjuster implements RegionalFrequencyBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RegionalFrequencyBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRegionalFrequencyBatchAdjuster implements RegionalFrequencyBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalFrequencyBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRegionalFrequencyBatchAdjuster implements RegionalFrequencyBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalFrequencyBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalFrequencyBatchAdjuster implements RegionalFrequencyBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalFrequencyBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional frequency batch steps in order and keeps a trace of each. */
export class RegionalFrequencyBatchEngine {
  steps: RegionalFrequencyBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFrequencyBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalFrequencyBatch): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalFrequencyBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalFrequencyBatchEngine(): RegionalFrequencyBatchEngine {
  return new RegionalFrequencyBatchEngine(
    [
      new NameRegionalFrequencyBatchAdjuster(new Map<string, number>([["online", 1.32], ["west", 0.74]])),
      new TieredRegionalFrequencyBatchAdjuster([439, 4835], [1.09, 1.03]),
      new PercentRegionalFrequencyBatchAdjuster(-18.7),
      new RoundingRegionalFrequencyBatchAdjuster(0.1),
    ],
    [],
    4.4,
    25596,
  );
}
