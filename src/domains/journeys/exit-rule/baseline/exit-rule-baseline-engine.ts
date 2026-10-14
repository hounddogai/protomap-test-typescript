import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleBaseline } from "./exit-rule-baseline.js";

/** One step of the exit rule baseline calculation. */
export interface ExitRuleBaselineFactor {
  describe(): string;
  adjust(item: ExitRuleBaseline, value: number): number;
}

export class TieredExitRuleBaselineAdjuster implements ExitRuleBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingExitRuleBaselineAdjuster implements ExitRuleBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ExitRuleBaselineRateOffsetAdjuster implements ExitRuleBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ExitRuleBaseline, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the exit rule baseline steps in order and keeps a trace of each. */
export class ExitRuleBaselineEngine {
  steps: ExitRuleBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleBaseline): number {
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

  evaluateAll(items: ExitRuleBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleBaselineEngine(): ExitRuleBaselineEngine {
  return new ExitRuleBaselineEngine(
    [
      new TieredExitRuleBaselineAdjuster([1263, 4854], [1.15, 0.93]),
      new RoundingExitRuleBaselineAdjuster(0.5),
      new ExitRuleBaselineRateOffsetAdjuster(1.96),
    ],
    [],
    1.6,
    12993.4,
  );
}
