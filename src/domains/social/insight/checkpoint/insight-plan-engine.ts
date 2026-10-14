import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightPlan } from "./insight-plan.js";

/** One step of the insight plan calculation. */
export interface InsightPlanModifier {
  describe(): string;
  adjust(item: InsightPlan, value: number): number;
}

export class PercentInsightPlanAdjuster implements InsightPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredInsightPlanAdjuster implements InsightPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInsightPlanAdjuster implements InsightPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedInsightPlanAdjuster implements InsightPlanModifier {
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

  adjust(item: InsightPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceInsightPlanAdjuster implements InsightPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: InsightPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight plan steps in order and keeps a trace of each. */
export class InsightPlanEngine {
  steps: InsightPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightPlan): number {
    let current = item.netValue();
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

  evaluateAll(items: InsightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightPlanEngine(flagsValue: flags.Registry): InsightPlanEngine {
  return new InsightPlanEngine(
    [
      new PercentInsightPlanAdjuster(23.6),
      new TieredInsightPlanAdjuster([690, 3067, 4235, 8471], [0.84, 1.14, 0.94, 1]),
      new RoundingInsightPlanAdjuster(0.05),
      new FlaggedInsightPlanAdjuster(flagsValue, "insight-plan-adaptive", 7.1),
      new SourceInsightPlanAdjuster(new Map<string, number>([["east", 0.9]])),
    ],
    [],
    2.2,
    78286,
  );
}
