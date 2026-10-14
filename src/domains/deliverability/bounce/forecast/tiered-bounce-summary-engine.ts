import * as numbers from "../../../../kit/numbers.js";
import { TieredBounceSummary } from "./tiered-bounce-summary.js";

/** One step of the tiered bounce summary calculation. */
export interface TieredBounceSummaryFactor {
  describe(): string;
  adjust(item: TieredBounceSummary, value: number): number;
}

export class TieredTieredBounceSummaryAdjuster implements TieredBounceSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBounceSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredBounceSummaryAdjuster implements TieredBounceSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBounceSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBounceSummaryAmountOffsetAdjuster implements TieredBounceSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: TieredBounceSummary, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class PercentTieredBounceSummaryAdjuster implements TieredBounceSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBounceSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered bounce summary steps in order and keeps a trace of each. */
export class TieredBounceSummaryEngine {
  steps: TieredBounceSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBounceSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredBounceSummary): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TieredBounceSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredBounceSummaryEngine(): TieredBounceSummaryEngine {
  return new TieredBounceSummaryEngine(
    [
      new TieredTieredBounceSummaryAdjuster([3308, 6397, 9956], [0.9, 0.82, 1.01]),
      new RoundingTieredBounceSummaryAdjuster(0.05),
      new TieredBounceSummaryAmountOffsetAdjuster(0.64),
      new PercentTieredBounceSummaryAdjuster(-14.5),
    ],
    [],
    3.1,
    89933.8,
  );
}
