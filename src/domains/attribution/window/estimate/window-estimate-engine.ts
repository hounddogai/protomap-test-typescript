import * as numbers from "../../../../kit/numbers.js";
import { WindowEstimate } from "./window-estimate.js";

/** One step of the window estimate calculation. */
export interface WindowEstimateModifier {
  describe(): string;
  adjust(item: WindowEstimate, value: number): number;
}

export class RoundingWindowEstimateAdjuster implements WindowEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WindowEstimateVersionOffsetAdjuster implements WindowEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: WindowEstimate, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentWindowEstimateAdjuster implements WindowEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceWindowEstimateAdjuster implements WindowEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WindowEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWindowEstimateAdjuster implements WindowEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWindowEstimateAdjuster implements WindowEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the window estimate steps in order and keeps a trace of each. */
export class WindowEstimateEngine {
  steps: WindowEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowEstimate): number {
    let current = item.netValue();
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

  evaluateAll(items: WindowEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowEstimateEngine(): WindowEstimateEngine {
  return new WindowEstimateEngine(
    [
      new RoundingWindowEstimateAdjuster(0.05),
      new WindowEstimateVersionOffsetAdjuster(1.51),
      new PercentWindowEstimateAdjuster(16.1),
      new SourceWindowEstimateAdjuster(new Map<string, number>([["online", 1.15], ["central", 0.78]])),
      new TieredWindowEstimateAdjuster([925, 5243, 7104], [0.91, 0.91, 1.11]),
      new CapWindowEstimateAdjuster(21789),
    ],
    [],
    4.3,
    55418.1,
  );
}
