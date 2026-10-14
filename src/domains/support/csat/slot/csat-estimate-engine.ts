import * as numbers from "../../../../kit/numbers.js";
import { CsatEstimate } from "./csat-estimate.js";

/** One step of the csat estimate calculation. */
export interface CsatEstimateModifier {
  describe(): string;
  adjust(item: CsatEstimate, value: number): number;
}

export class PercentCsatEstimateAdjuster implements CsatEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCsatEstimateAdjuster implements CsatEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCsatEstimateAdjuster implements CsatEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the csat estimate steps in order and keeps a trace of each. */
export class CsatEstimateEngine {
  steps: CsatEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CsatEstimate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CsatEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCsatEstimateEngine(): CsatEstimateEngine {
  return new CsatEstimateEngine(
    [
      new PercentCsatEstimateAdjuster(1.1),
      new CapCsatEstimateAdjuster(11911),
      new TieredCsatEstimateAdjuster([2989, 6794, 7215, 8808], [1.08, 1.12, 0.93, 0.94]),
    ],
    [],
    3.6,
    70225.9,
  );
}
