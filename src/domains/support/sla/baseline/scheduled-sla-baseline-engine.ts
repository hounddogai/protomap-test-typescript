import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSlaBaseline } from "./scheduled-sla-baseline.js";

/** One step of the scheduled sla baseline calculation. */
export interface ScheduledSlaBaselineStep {
  describe(): string;
  adjust(item: ScheduledSlaBaseline, value: number): number;
}

export class ScheduledSlaBaselineOpenRateOffsetAdjuster implements ScheduledSlaBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ScheduledSlaBaseline, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingScheduledSlaBaselineAdjuster implements ScheduledSlaBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledSlaBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledSlaBaselineAdjuster implements ScheduledSlaBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledSlaBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledSlaBaselineAdjuster implements ScheduledSlaBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSlaBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledSlaBaselineAdjuster implements ScheduledSlaBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSlaBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled sla baseline steps in order and keeps a trace of each. */
export class ScheduledSlaBaselineEngine {
  steps: ScheduledSlaBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSlaBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledSlaBaseline): number {
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

  evaluateAll(items: ScheduledSlaBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledSlaBaselineEngine(): ScheduledSlaBaselineEngine {
  return new ScheduledSlaBaselineEngine(
    [
      new ScheduledSlaBaselineOpenRateOffsetAdjuster(0.17),
      new RoundingScheduledSlaBaselineAdjuster(0.25),
      new CapScheduledSlaBaselineAdjuster(25828),
      new PercentScheduledSlaBaselineAdjuster(5.1),
      new TieredScheduledSlaBaselineAdjuster([2239, 4995, 8536], [0.84, 0.85, 1.18]),
    ],
    [],
    2.5,
    7871.8,
  );
}
