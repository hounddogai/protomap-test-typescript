import * as numbers from "../../../../kit/numbers.js";
import { FunnelScore } from "./funnel-score.js";

/** One step of the funnel score calculation. */
export interface FunnelScoreStep {
  describe(): string;
  adjust(item: FunnelScore, value: number): number;
}

export class FunnelScoreRetriesOffsetAdjuster implements FunnelScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: FunnelScore, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredFunnelScoreAdjuster implements FunnelScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleFunnelScoreAdjuster implements FunnelScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FunnelScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFunnelScoreAdjuster implements FunnelScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFunnelScoreAdjuster implements FunnelScoreStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFunnelScoreAdjuster implements FunnelScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel score steps in order and keeps a trace of each. */
export class FunnelScoreEngine {
  steps: FunnelScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelScore): number {
    let current = item.weightedValue();
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

  evaluateAll(items: FunnelScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelScoreEngine(): FunnelScoreEngine {
  return new FunnelScoreEngine(
    [
      new FunnelScoreRetriesOffsetAdjuster(1.82),
      new TieredFunnelScoreAdjuster([5819, 8323], [0.87, 0.9]),
      new LocaleFunnelScoreAdjuster(new Map<string, number>([["online", 1.13], ["south", 0.82]])),
      new MinimumFunnelScoreAdjuster(45),
      new CapFunnelScoreAdjuster(33501),
      new PercentFunnelScoreAdjuster(15.6),
    ],
    [],
    1.4,
    29325.5,
  );
}
