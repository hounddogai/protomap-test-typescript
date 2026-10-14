import * as numbers from "../../../../kit/numbers.js";
import { FallbackInsightException } from "./fallback-insight-exception.js";

/** One step of the fallback insight exception calculation. */
export interface FallbackInsightExceptionStep {
  describe(): string;
  adjust(item: FallbackInsightException, value: number): number;
}

export class CapFallbackInsightExceptionAdjuster implements FallbackInsightExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackInsightException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackInsightExceptionAdjuster implements FallbackInsightExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackInsightException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFallbackInsightExceptionAdjuster implements FallbackInsightExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackInsightException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackInsightExceptionDurationMinutesOffsetAdjuster implements FallbackInsightExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: FallbackInsightException, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class PercentFallbackInsightExceptionAdjuster implements FallbackInsightExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackInsightException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackInsightExceptionAdjuster implements FallbackInsightExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackInsightException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback insight exception steps in order and keeps a trace of each. */
export class FallbackInsightExceptionEngine {
  steps: FallbackInsightExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackInsightExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackInsightException): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FallbackInsightException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackInsightExceptionEngine(): FallbackInsightExceptionEngine {
  return new FallbackInsightExceptionEngine(
    [
      new CapFallbackInsightExceptionAdjuster(39695),
      new TieredFallbackInsightExceptionAdjuster([545, 8548], [0.88, 0.88]),
      new RoundingFallbackInsightExceptionAdjuster(1),
      new FallbackInsightExceptionDurationMinutesOffsetAdjuster(0.08),
      new PercentFallbackInsightExceptionAdjuster(8.6),
      new MinimumFallbackInsightExceptionAdjuster(49.2),
    ],
    [],
    1.3,
    5894.8,
  );
}
