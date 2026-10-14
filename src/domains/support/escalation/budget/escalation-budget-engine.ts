import { EscalationBudget } from "./escalation-budget.js";

/** One step of the escalation budget calculation. */
export interface EscalationBudgetStep {
  describe(): string;
  adjust(item: EscalationBudget, value: number): number;
}

export class TitleEscalationBudgetAdjuster implements EscalationBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: EscalationBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredEscalationBudgetAdjuster implements EscalationBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentEscalationBudgetAdjuster implements EscalationBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the escalation budget steps in order and keeps a trace of each. */
export class EscalationBudgetEngine {
  steps: EscalationBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EscalationBudget): number {
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

  evaluateAll(items: EscalationBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEscalationBudgetEngine(): EscalationBudgetEngine {
  return new EscalationBudgetEngine(
    [
      new TitleEscalationBudgetAdjuster(new Map<string, number>([["south", 1.37], ["east", 1.08]])),
      new TieredEscalationBudgetAdjuster([4292, 6896], [0.9, 1.2]),
      new PercentEscalationBudgetAdjuster(-17.1),
    ],
    [],
    0.3,
    25207.1,
  );
}
