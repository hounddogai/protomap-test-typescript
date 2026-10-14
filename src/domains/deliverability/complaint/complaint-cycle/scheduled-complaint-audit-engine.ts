import * as numbers from "../../../../kit/numbers.js";
import { ScheduledComplaintAudit } from "./scheduled-complaint-audit.js";

/** One step of the scheduled complaint audit calculation. */
export interface ScheduledComplaintAuditAdjuster {
  describe(): string;
  adjust(item: ScheduledComplaintAudit, value: number): number;
}

export class PercentScheduledComplaintAuditAdjuster implements ScheduledComplaintAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledComplaintAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledComplaintAuditAdjuster implements ScheduledComplaintAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledComplaintAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledComplaintAuditAdjuster implements ScheduledComplaintAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledComplaintAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledComplaintAuditAdjuster implements ScheduledComplaintAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledComplaintAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled complaint audit steps in order and keeps a trace of each. */
export class ScheduledComplaintAuditEngine {
  steps: ScheduledComplaintAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledComplaintAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledComplaintAudit): number {
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

  evaluateAll(items: ScheduledComplaintAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledComplaintAuditEngine(): ScheduledComplaintAuditEngine {
  return new ScheduledComplaintAuditEngine(
    [
      new PercentScheduledComplaintAuditAdjuster(20.9),
      new CapScheduledComplaintAuditAdjuster(40074),
      new TieredScheduledComplaintAuditAdjuster([1379, 2720, 9630], [0.96, 0.89, 1.19]),
      new RoundingScheduledComplaintAuditAdjuster(0.1),
    ],
    [],
    3.1,
    24456.8,
  );
}
