import * as numbers from "../../../../kit/numbers.js";
import { PendingCohortSchedule } from "./pending-cohort-schedule.js";

/** One step of the pending cohort schedule calculation. */
export interface PendingCohortScheduleAdjuster {
  describe(): string;
  adjust(item: PendingCohortSchedule, value: number): number;
}

export class TieredPendingCohortScheduleAdjuster implements PendingCohortScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCohortSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelPendingCohortScheduleAdjuster implements PendingCohortScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingCohortSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingCohortScheduleAdjuster implements PendingCohortScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCohortSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingCohortScheduleAdjuster implements PendingCohortScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingCohortSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingCohortScheduleMarginOffsetAdjuster implements PendingCohortScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PendingCohortSchedule, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the pending cohort schedule steps in order and keeps a trace of each. */
export class PendingCohortScheduleEngine {
  steps: PendingCohortScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCohortScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingCohortSchedule): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PendingCohortSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingCohortScheduleEngine(): PendingCohortScheduleEngine {
  return new PendingCohortScheduleEngine(
    [
      new TieredPendingCohortScheduleAdjuster([1074, 5786, 7646], [0.86, 1.04, 1.02]),
      new LabelPendingCohortScheduleAdjuster(new Map<string, number>([["central", 1.39], ["west", 1.32]])),
      new PercentPendingCohortScheduleAdjuster(3.1),
      new RoundingPendingCohortScheduleAdjuster(0.1),
      new PendingCohortScheduleMarginOffsetAdjuster(1.08),
    ],
    [],
    4.9,
    77048.3,
  );
}
