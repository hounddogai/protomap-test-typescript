import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFunnelCheckpoint } from "./scheduled-funnel-checkpoint.js";

/** One step of the scheduled funnel checkpoint calculation. */
export interface ScheduledFunnelCheckpointStep {
  describe(): string;
  adjust(item: ScheduledFunnelCheckpoint, value: number): number;
}

export class ScheduledFunnelCheckpointMarginOffsetAdjuster implements ScheduledFunnelCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ScheduledFunnelCheckpoint, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumScheduledFunnelCheckpointAdjuster implements ScheduledFunnelCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFunnelCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentScheduledFunnelCheckpointAdjuster implements ScheduledFunnelCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledFunnelCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledFunnelCheckpointAdjuster implements ScheduledFunnelCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFunnelCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledFunnelCheckpointAdjuster implements ScheduledFunnelCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFunnelCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled funnel checkpoint steps in order and keeps a trace of each. */
export class ScheduledFunnelCheckpointEngine {
  steps: ScheduledFunnelCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFunnelCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledFunnelCheckpoint): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ScheduledFunnelCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledFunnelCheckpointEngine(): ScheduledFunnelCheckpointEngine {
  return new ScheduledFunnelCheckpointEngine(
    [
      new ScheduledFunnelCheckpointMarginOffsetAdjuster(0.23),
      new MinimumScheduledFunnelCheckpointAdjuster(7.9),
      new PercentScheduledFunnelCheckpointAdjuster(-24.4),
      new CapScheduledFunnelCheckpointAdjuster(10080),
      new RoundingScheduledFunnelCheckpointAdjuster(0.05),
    ],
    [],
    2.8,
    46400.6,
  );
}
