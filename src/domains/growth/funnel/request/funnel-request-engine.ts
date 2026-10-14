import * as numbers from "../../../../kit/numbers.js";
import { FunnelRequest } from "./funnel-request.js";

/** One step of the funnel request calculation. */
export interface FunnelRequestStep {
  describe(): string;
  adjust(item: FunnelRequest, value: number): number;
}

export class PercentFunnelRequestAdjuster implements FunnelRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFunnelRequestAdjuster implements FunnelRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleFunnelRequestAdjuster implements FunnelRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FunnelRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFunnelRequestAdjuster implements FunnelRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFunnelRequestAdjuster implements FunnelRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFunnelRequestAdjuster implements FunnelRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel request steps in order and keeps a trace of each. */
export class FunnelRequestEngine {
  steps: FunnelRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelRequest): number {
    let current = item.netLoad();
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

  evaluateAll(items: FunnelRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelRequestEngine(): FunnelRequestEngine {
  return new FunnelRequestEngine(
    [
      new PercentFunnelRequestAdjuster(18.9),
      new MinimumFunnelRequestAdjuster(10.7),
      new TitleFunnelRequestAdjuster(new Map<string, number>([["online", 0.72]])),
      new TieredFunnelRequestAdjuster([5278, 6155, 8431], [0.9, 0.92, 1.02]),
      new RoundingFunnelRequestAdjuster(0.5),
      new CapFunnelRequestAdjuster(26667),
    ],
    [],
    4.1,
    4450.3,
  );
}
