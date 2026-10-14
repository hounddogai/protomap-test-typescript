import * as numbers from "../../../../kit/numbers.js";
import { InsightAgreement } from "./insight-agreement.js";

/** One step of the insight agreement calculation. */
export interface InsightAgreementStep {
  describe(): string;
  adjust(item: InsightAgreement, value: number): number;
}

export class RoundingInsightAgreementAdjuster implements InsightAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapInsightAgreementAdjuster implements InsightAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredInsightAgreementAdjuster implements InsightAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the insight agreement steps in order and keeps a trace of each. */
export class InsightAgreementEngine {
  steps: InsightAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightAgreement): number {
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

  evaluateAll(items: InsightAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightAgreementEngine(): InsightAgreementEngine {
  return new InsightAgreementEngine(
    [
      new RoundingInsightAgreementAdjuster(0.5),
      new CapInsightAgreementAdjuster(34403),
      new TieredInsightAgreementAdjuster([1444, 6130, 6961], [0.96, 0.82, 0.85]),
    ],
    [],
    3.3,
    62306.6,
  );
}
