import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditEstimate } from "./credit-estimate.js";

/** One step of the credit estimate calculation. */
export interface CreditEstimateStep {
  describe(): string;
  adjust(item: CreditEstimate, value: number): number;
}

export class RoundingCreditEstimateAdjuster implements CreditEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCreditEstimateAdjuster implements CreditEstimateStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: CreditEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCreditEstimateAdjuster implements CreditEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the credit estimate steps in order and keeps a trace of each. */
export class CreditEstimateEngine {
  steps: CreditEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditEstimate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CreditEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditEstimateEngine(flagsValue: flags.Registry): CreditEstimateEngine {
  return new CreditEstimateEngine(
    [
      new RoundingCreditEstimateAdjuster(0.1),
      new FlaggedCreditEstimateAdjuster(flagsValue, "credit-estimate-pending", -7.6),
      new MinimumCreditEstimateAdjuster(2.5),
    ],
    [],
    3.5,
    51748.7,
  );
}
