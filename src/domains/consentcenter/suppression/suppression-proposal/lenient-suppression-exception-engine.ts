import * as numbers from "../../../../kit/numbers.js";
import { LenientSuppressionException } from "./lenient-suppression-exception.js";

/** One step of the lenient suppression exception calculation. */
export interface LenientSuppressionExceptionStep {
  describe(): string;
  adjust(item: LenientSuppressionException, value: number): number;
}

export class PercentLenientSuppressionExceptionAdjuster implements LenientSuppressionExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientSuppressionException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientSuppressionExceptionAdjuster implements LenientSuppressionExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientSuppressionException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientSuppressionExceptionAdjuster implements LenientSuppressionExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientSuppressionException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientSuppressionExceptionAdjuster implements LenientSuppressionExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientSuppressionException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient suppression exception steps in order and keeps a trace of each. */
export class LenientSuppressionExceptionEngine {
  steps: LenientSuppressionExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSuppressionExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientSuppressionException): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientSuppressionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientSuppressionExceptionEngine(): LenientSuppressionExceptionEngine {
  return new LenientSuppressionExceptionEngine(
    [
      new PercentLenientSuppressionExceptionAdjuster(10.3),
      new CapLenientSuppressionExceptionAdjuster(44607),
      new TieredLenientSuppressionExceptionAdjuster([540, 632, 8058, 8863], [1.12, 0.89, 0.96, 1.09]),
      new RoundingLenientSuppressionExceptionAdjuster(0.05),
    ],
    [],
    4.7,
    43252,
  );
}
