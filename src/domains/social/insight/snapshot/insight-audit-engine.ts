import { InsightAudit } from "./insight-audit.js";

/** One step of the insight audit calculation. */
export interface InsightAuditModifier {
  describe(): string;
  adjust(item: InsightAudit, value: number): number;
}

export class CountryInsightAuditAdjuster implements InsightAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: InsightAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredInsightAuditAdjuster implements InsightAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class InsightAuditAmountOffsetAdjuster implements InsightAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: InsightAudit, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the insight audit steps in order and keeps a trace of each. */
export class InsightAuditEngine {
  steps: InsightAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightAudit): number {
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

  evaluateAll(items: InsightAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightAuditEngine(): InsightAuditEngine {
  return new InsightAuditEngine(
    [
      new CountryInsightAuditAdjuster(new Map<string, number>([["online", 0.97]])),
      new TieredInsightAuditAdjuster([1214, 1823, 2495, 4996], [0.8, 1.02, 1.15, 1.04]),
      new InsightAuditAmountOffsetAdjuster(0.19),
    ],
    [],
    4.2,
    31198,
  );
}
