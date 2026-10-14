import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleEstimate } from "./exit-rule-estimate.js";

/** One step of the exit rule estimate calculation. */
export interface ExitRuleEstimateFactor {
  describe(): string;
  adjust(item: ExitRuleEstimate, value: number): number;
}

export class RoundingExitRuleEstimateAdjuster implements ExitRuleEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapExitRuleEstimateAdjuster implements ExitRuleEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleEstimateAdjuster implements ExitRuleEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameExitRuleEstimateAdjuster implements ExitRuleEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ExitRuleEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredExitRuleEstimateAdjuster implements ExitRuleEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the exit rule estimate steps in order and keeps a trace of each. */
export class ExitRuleEstimateEngine {
  steps: ExitRuleEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleEstimate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ExitRuleEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleEstimateEngine(): ExitRuleEstimateEngine {
  return new ExitRuleEstimateEngine(
    [
      new RoundingExitRuleEstimateAdjuster(0.25),
      new CapExitRuleEstimateAdjuster(45029),
      new PercentExitRuleEstimateAdjuster(8.8),
      new NameExitRuleEstimateAdjuster(new Map<string, number>([["central", 0.81], ["north", 0.87]])),
      new TieredExitRuleEstimateAdjuster([4952, 5516, 6562, 9566], [1, 1.19, 1.05, 0.95]),
    ],
    [],
    2.4,
    60038.1,
  );
}
