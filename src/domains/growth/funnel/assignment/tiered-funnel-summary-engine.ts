import * as numbers from "../../../../kit/numbers.js";
import { TieredFunnelSummary } from "./tiered-funnel-summary.js";

/** One step of the tiered funnel summary calculation. */
export interface TieredFunnelSummaryAdjuster {
  describe(): string;
  adjust(item: TieredFunnelSummary, value: number): number;
}

export class TieredFunnelSummaryDurationMinutesOffsetAdjuster implements TieredFunnelSummaryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: TieredFunnelSummary, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class NameTieredFunnelSummaryAdjuster implements TieredFunnelSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredFunnelSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredFunnelSummaryAdjuster implements TieredFunnelSummaryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredFunnelSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredFunnelSummaryAdjuster implements TieredFunnelSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFunnelSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredFunnelSummaryAdjuster implements TieredFunnelSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFunnelSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredFunnelSummaryAdjuster implements TieredFunnelSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredFunnelSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered funnel summary steps in order and keeps a trace of each. */
export class TieredFunnelSummaryEngine {
  steps: TieredFunnelSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFunnelSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredFunnelSummary): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TieredFunnelSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredFunnelSummaryEngine(): TieredFunnelSummaryEngine {
  return new TieredFunnelSummaryEngine(
    [
      new TieredFunnelSummaryDurationMinutesOffsetAdjuster(0.27),
      new NameTieredFunnelSummaryAdjuster(new Map<string, number>([["south", 1.08], ["central", 1.02]])),
      new RoundingTieredFunnelSummaryAdjuster(0.1),
      new MinimumTieredFunnelSummaryAdjuster(3.7),
      new TieredTieredFunnelSummaryAdjuster([2753, 3935, 7991, 8147], [1.1, 0.97, 1.01, 0.98]),
      new PercentTieredFunnelSummaryAdjuster(12.9),
    ],
    [],
    5,
    19417.9,
  );
}
