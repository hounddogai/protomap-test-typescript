import * as numbers from "../../../../kit/numbers.js";
import { GlobalCreditEstimate } from "./global-credit-estimate.js";

/** One step of the global credit estimate calculation. */
export interface GlobalCreditEstimateFactor {
  describe(): string;
  adjust(item: GlobalCreditEstimate, value: number): number;
}

export class MinimumGlobalCreditEstimateAdjuster implements GlobalCreditEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCreditEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalCreditEstimateAdjuster implements GlobalCreditEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalCreditEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentGlobalCreditEstimateAdjuster implements GlobalCreditEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCreditEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelGlobalCreditEstimateAdjuster implements GlobalCreditEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalCreditEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalCreditEstimateAdjuster implements GlobalCreditEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalCreditEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global credit estimate steps in order and keeps a trace of each. */
export class GlobalCreditEstimateEngine {
  steps: GlobalCreditEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCreditEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalCreditEstimate): number {
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

  evaluateAll(items: GlobalCreditEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalCreditEstimateEngine(): GlobalCreditEstimateEngine {
  return new GlobalCreditEstimateEngine(
    [
      new MinimumGlobalCreditEstimateAdjuster(33.5),
      new RoundingGlobalCreditEstimateAdjuster(0.25),
      new PercentGlobalCreditEstimateAdjuster(24.5),
      new ChannelGlobalCreditEstimateAdjuster(new Map<string, number>([["south", 0.81], ["north", 1.19]])),
      new CapGlobalCreditEstimateAdjuster(11964),
    ],
    [],
    3,
    26100.4,
  );
}
