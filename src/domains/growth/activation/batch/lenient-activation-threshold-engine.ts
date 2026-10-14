import * as numbers from "../../../../kit/numbers.js";
import { LenientActivationThreshold } from "./lenient-activation-threshold.js";

/** One step of the lenient activation threshold calculation. */
export interface LenientActivationThresholdFactor {
  describe(): string;
  adjust(item: LenientActivationThreshold, value: number): number;
}

export class RoundingLenientActivationThresholdAdjuster implements LenientActivationThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientActivationThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLenientActivationThresholdAdjuster implements LenientActivationThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientActivationThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientActivationThresholdAdjuster implements LenientActivationThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientActivationThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient activation threshold steps in order and keeps a trace of each. */
export class LenientActivationThresholdEngine {
  steps: LenientActivationThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientActivationThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientActivationThreshold): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: LenientActivationThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientActivationThresholdEngine(): LenientActivationThresholdEngine {
  return new LenientActivationThresholdEngine(
    [
      new RoundingLenientActivationThresholdAdjuster(0.25),
      new TieredLenientActivationThresholdAdjuster([3742, 7950], [0.89, 1.06]),
      new MinimumLenientActivationThresholdAdjuster(5.1),
    ],
    [],
    2.3,
    14850.7,
  );
}
