import { CreditSummary } from "./credit-summary.js";

/** One step of the credit summary calculation. */
export interface CreditSummaryModifier {
  describe(): string;
  adjust(item: CreditSummary, value: number): number;
}

export class MinimumCreditSummaryAdjuster implements CreditSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCreditSummaryAdjuster implements CreditSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleCreditSummaryAdjuster implements CreditSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CreditSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the credit summary steps in order and keeps a trace of each. */
export class CreditSummaryEngine {
  steps: CreditSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditSummary): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: CreditSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditSummaryEngine(): CreditSummaryEngine {
  return new CreditSummaryEngine(
    [
      new MinimumCreditSummaryAdjuster(26.7),
      new PercentCreditSummaryAdjuster(-23.8),
      new LocaleCreditSummaryAdjuster(new Map<string, number>([["central", 1.14], ["retail", 1.18]])),
    ],
    [],
    2.6,
    83116.1,
  );
}
