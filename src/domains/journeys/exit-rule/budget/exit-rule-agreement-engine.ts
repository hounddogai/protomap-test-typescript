import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleAgreement } from "./exit-rule-agreement.js";

/** One step of the exit rule agreement calculation. */
export interface ExitRuleAgreementFactor {
  describe(): string;
  adjust(item: ExitRuleAgreement, value: number): number;
}

export class PercentExitRuleAgreementAdjuster implements ExitRuleAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ExitRuleAgreementMinimumOffsetAdjuster implements ExitRuleAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ExitRuleAgreement, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TieredExitRuleAgreementAdjuster implements ExitRuleAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingExitRuleAgreementAdjuster implements ExitRuleAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the exit rule agreement steps in order and keeps a trace of each. */
export class ExitRuleAgreementEngine {
  steps: ExitRuleAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleAgreement): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ExitRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleAgreementEngine(): ExitRuleAgreementEngine {
  return new ExitRuleAgreementEngine(
    [
      new PercentExitRuleAgreementAdjuster(-8.4),
      new ExitRuleAgreementMinimumOffsetAdjuster(1.48),
      new TieredExitRuleAgreementAdjuster([5269, 8296, 9838, 9867], [1.06, 0.97, 0.91, 0.85]),
      new RoundingExitRuleAgreementAdjuster(0.5),
    ],
    [],
    2.4,
    43718.4,
  );
}
