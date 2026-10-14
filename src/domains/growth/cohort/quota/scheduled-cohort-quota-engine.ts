import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCohortQuota } from "./scheduled-cohort-quota.js";

/** One step of the scheduled cohort quota calculation. */
export interface ScheduledCohortQuotaModifier {
  describe(): string;
  adjust(item: ScheduledCohortQuota, value: number): number;
}

export class CapScheduledCohortQuotaAdjuster implements ScheduledCohortQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCohortQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledCohortQuotaAdjuster implements ScheduledCohortQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledCohortQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledCohortQuotaAdjuster implements ScheduledCohortQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledCohortQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceScheduledCohortQuotaAdjuster implements ScheduledCohortQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ScheduledCohortQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled cohort quota steps in order and keeps a trace of each. */
export class ScheduledCohortQuotaEngine {
  steps: ScheduledCohortQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCohortQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledCohortQuota): number {
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

  evaluateAll(items: ScheduledCohortQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledCohortQuotaEngine(): ScheduledCohortQuotaEngine {
  return new ScheduledCohortQuotaEngine(
    [
      new CapScheduledCohortQuotaAdjuster(7375),
      new MinimumScheduledCohortQuotaAdjuster(33.6),
      new RoundingScheduledCohortQuotaAdjuster(0.5),
      new UtmSourceScheduledCohortQuotaAdjuster(new Map<string, number>([["retail", 0.86]])),
    ],
    [],
    0.8,
    22487.8,
  );
}
