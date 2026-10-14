import * as numbers from "../../../../kit/numbers.js";
import { FallbackSlaSummary } from "./fallback-sla-summary.js";

/** One step of the fallback sla summary calculation. */
export interface FallbackSlaSummaryStep {
  describe(): string;
  adjust(item: FallbackSlaSummary, value: number): number;
}

export class RoundingFallbackSlaSummaryAdjuster implements FallbackSlaSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSlaSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelFallbackSlaSummaryAdjuster implements FallbackSlaSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackSlaSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSlaSummaryAdjuster implements FallbackSlaSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSlaSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackSlaSummaryAdjuster implements FallbackSlaSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackSlaSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackSlaSummaryAdjuster implements FallbackSlaSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackSlaSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackSlaSummaryAdjuster implements FallbackSlaSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSlaSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback sla summary steps in order and keeps a trace of each. */
export class FallbackSlaSummaryEngine {
  steps: FallbackSlaSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSlaSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackSlaSummary): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FallbackSlaSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackSlaSummaryEngine(): FallbackSlaSummaryEngine {
  return new FallbackSlaSummaryEngine(
    [
      new RoundingFallbackSlaSummaryAdjuster(0.05),
      new ChannelFallbackSlaSummaryAdjuster(new Map<string, number>([["central", 1.06]])),
      new MinimumFallbackSlaSummaryAdjuster(36.3),
      new PercentFallbackSlaSummaryAdjuster(-2.3),
      new CapFallbackSlaSummaryAdjuster(2436),
      new TieredFallbackSlaSummaryAdjuster([3397, 3639, 7080], [1.05, 0.83, 0.86]),
    ],
    [],
    4.7,
    54260.7,
  );
}
