import { ManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

/** One step of the manual fraud check plan calculation. */
export interface ManualFraudCheckPlanFactor {
  describe(): string;
  adjust(item: ManualFraudCheckPlan, value: number): number;
}

export class PercentManualFraudCheckPlanAdjuster implements ManualFraudCheckPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualFraudCheckPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ManualFraudCheckPlanStartsAtOffsetAdjuster implements ManualFraudCheckPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: ManualFraudCheckPlan, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class CapManualFraudCheckPlanAdjuster implements ManualFraudCheckPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualFraudCheckPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualFraudCheckPlanAdjuster implements ManualFraudCheckPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualFraudCheckPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual fraud check plan steps in order and keeps a trace of each. */
export class ManualFraudCheckPlanEngine {
  steps: ManualFraudCheckPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFraudCheckPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualFraudCheckPlan): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ManualFraudCheckPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualFraudCheckPlanEngine(): ManualFraudCheckPlanEngine {
  return new ManualFraudCheckPlanEngine(
    [
      new PercentManualFraudCheckPlanAdjuster(24.7),
      new ManualFraudCheckPlanStartsAtOffsetAdjuster(0.49),
      new CapManualFraudCheckPlanAdjuster(41363),
      new TieredManualFraudCheckPlanAdjuster([989, 3181], [1.14, 1.03]),
    ],
    [],
    4,
    70487.6,
  );
}
