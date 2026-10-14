import * as numbers from "../../../../kit/numbers.js";
import { FallbackNudgeSummary } from "./fallback-nudge-summary.js";

/** One step of the fallback nudge summary calculation. */
export interface FallbackNudgeSummaryStep {
  describe(): string;
  adjust(item: FallbackNudgeSummary, value: number): number;
}

export class RoundingFallbackNudgeSummaryAdjuster implements FallbackNudgeSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackNudgeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackNudgeSummaryAdjuster implements FallbackNudgeSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackNudgeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleFallbackNudgeSummaryAdjuster implements FallbackNudgeSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackNudgeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFallbackNudgeSummaryAdjuster implements FallbackNudgeSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackNudgeSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackNudgeSummaryAdjuster implements FallbackNudgeSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackNudgeSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback nudge summary steps in order and keeps a trace of each. */
export class FallbackNudgeSummaryEngine {
  steps: FallbackNudgeSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackNudgeSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackNudgeSummary): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackNudgeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackNudgeSummaryEngine(): FallbackNudgeSummaryEngine {
  return new FallbackNudgeSummaryEngine(
    [
      new RoundingFallbackNudgeSummaryAdjuster(0.05),
      new TieredFallbackNudgeSummaryAdjuster([2710, 2750], [1.14, 0.86]),
      new LocaleFallbackNudgeSummaryAdjuster(new Map<string, number>([["north", 0.8], ["west", 1.4]])),
      new PercentFallbackNudgeSummaryAdjuster(-2.5),
      new MinimumFallbackNudgeSummaryAdjuster(11.3),
    ],
    [],
    4.3,
    97442.8,
  );
}
