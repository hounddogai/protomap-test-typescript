import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCsatRequest } from "./adaptive-csat-request.js";

/** One step of the adaptive csat request calculation. */
export interface AdaptiveCsatRequestAdjuster {
  describe(): string;
  adjust(item: AdaptiveCsatRequest, value: number): number;
}

export class TieredAdaptiveCsatRequestAdjuster implements AdaptiveCsatRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCsatRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveCsatRequestAdjuster implements AdaptiveCsatRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveCsatRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveCsatRequestAdjuster implements AdaptiveCsatRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveCsatRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveCsatRequestGraceDaysOffsetAdjuster implements AdaptiveCsatRequestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: AdaptiveCsatRequest, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the adaptive csat request steps in order and keeps a trace of each. */
export class AdaptiveCsatRequestEngine {
  steps: AdaptiveCsatRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCsatRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveCsatRequest): number {
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

  evaluateAll(items: AdaptiveCsatRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveCsatRequestEngine(): AdaptiveCsatRequestEngine {
  return new AdaptiveCsatRequestEngine(
    [
      new TieredAdaptiveCsatRequestAdjuster([2443, 5926, 7527], [0.98, 0.92, 1.15]),
      new CapAdaptiveCsatRequestAdjuster(2239),
      new RoundingAdaptiveCsatRequestAdjuster(5),
      new AdaptiveCsatRequestGraceDaysOffsetAdjuster(0.14),
    ],
    [],
    1.8,
    20436.1,
  );
}
