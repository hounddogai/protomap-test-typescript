import * as numbers from "../../../../kit/numbers.js";
import { PendingInsightPlan } from "./pending-insight-plan.js";

/** One step of the pending insight plan calculation. */
export interface PendingInsightPlanAdjuster {
  describe(): string;
  adjust(item: PendingInsightPlan, value: number): number;
}

export class RoundingPendingInsightPlanAdjuster implements PendingInsightPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingInsightPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NamePendingInsightPlanAdjuster implements PendingInsightPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingInsightPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingInsightPlanAdjuster implements PendingInsightPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInsightPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingInsightPlanAdjuster implements PendingInsightPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingInsightPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingInsightPlanAdjuster implements PendingInsightPlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInsightPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingInsightPlanAdjuster implements PendingInsightPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingInsightPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending insight plan steps in order and keeps a trace of each. */
export class PendingInsightPlanEngine {
  steps: PendingInsightPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInsightPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingInsightPlan): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PendingInsightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingInsightPlanEngine(): PendingInsightPlanEngine {
  return new PendingInsightPlanEngine(
    [
      new RoundingPendingInsightPlanAdjuster(0.5),
      new NamePendingInsightPlanAdjuster(new Map<string, number>([["online", 1.17], ["retail", 1.26]])),
      new PercentPendingInsightPlanAdjuster(-2.6),
      new MinimumPendingInsightPlanAdjuster(13.9),
      new CapPendingInsightPlanAdjuster(49448),
      new TieredPendingInsightPlanAdjuster([340, 525, 2291, 5967], [1.03, 0.95, 0.83, 0.96]),
    ],
    [],
    0.2,
    2531,
  );
}
