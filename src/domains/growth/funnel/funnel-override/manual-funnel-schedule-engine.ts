import { ManualFunnelSchedule } from "./manual-funnel-schedule.js";

/** One step of the manual funnel schedule calculation. */
export interface ManualFunnelScheduleStep {
  describe(): string;
  adjust(item: ManualFunnelSchedule, value: number): number;
}

export class TieredManualFunnelScheduleAdjuster implements ManualFunnelScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualFunnelSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentManualFunnelScheduleAdjuster implements ManualFunnelScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualFunnelSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelManualFunnelScheduleAdjuster implements ManualFunnelScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualFunnelSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualFunnelScheduleAdjuster implements ManualFunnelScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualFunnelSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual funnel schedule steps in order and keeps a trace of each. */
export class ManualFunnelScheduleEngine {
  steps: ManualFunnelScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFunnelScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualFunnelSchedule): number {
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

  evaluateAll(items: ManualFunnelSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualFunnelScheduleEngine(): ManualFunnelScheduleEngine {
  return new ManualFunnelScheduleEngine(
    [
      new TieredManualFunnelScheduleAdjuster([315, 8653, 9574, 9611], [1.14, 0.8, 1.2, 0.89]),
      new PercentManualFunnelScheduleAdjuster(-8.5),
      new LabelManualFunnelScheduleAdjuster(
        new Map<string, number>([["east", 1.33], ["retail", 1.05], ["south", 1.13]]),
      ),
      new CapManualFunnelScheduleAdjuster(14729),
    ],
    [],
    2.6,
    10311.6,
  );
}
