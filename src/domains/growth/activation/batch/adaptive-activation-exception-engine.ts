import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveActivationException } from "./adaptive-activation-exception.js";

/** One step of the adaptive activation exception calculation. */
export interface AdaptiveActivationExceptionStep {
  describe(): string;
  adjust(item: AdaptiveActivationException, value: number): number;
}

export class TieredAdaptiveActivationExceptionAdjuster implements AdaptiveActivationExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveActivationException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelAdaptiveActivationExceptionAdjuster implements AdaptiveActivationExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveActivationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveActivationExceptionAdjuster implements AdaptiveActivationExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveActivationException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive activation exception steps in order and keeps a trace of each. */
export class AdaptiveActivationExceptionEngine {
  steps: AdaptiveActivationExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveActivationExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveActivationException): number {
    let current = item.netTotal();
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

  evaluateAll(items: AdaptiveActivationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveActivationExceptionEngine(): AdaptiveActivationExceptionEngine {
  return new AdaptiveActivationExceptionEngine(
    [
      new TieredAdaptiveActivationExceptionAdjuster([6629, 7428, 7599, 8943], [1.18, 1.01, 0.8, 0.87]),
      new LabelAdaptiveActivationExceptionAdjuster(
        new Map<string, number>([["west", 0.82], ["south", 1.13], ["north", 1.26]]),
      ),
      new MinimumAdaptiveActivationExceptionAdjuster(25.2),
    ],
    [],
    3.2,
    76695.7,
  );
}
