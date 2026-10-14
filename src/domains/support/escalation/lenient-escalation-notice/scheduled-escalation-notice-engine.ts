import * as numbers from "../../../../kit/numbers.js";
import { ScheduledEscalationNotice } from "./scheduled-escalation-notice.js";

/** One step of the scheduled escalation notice calculation. */
export interface ScheduledEscalationNoticeStep {
  describe(): string;
  adjust(item: ScheduledEscalationNotice, value: number): number;
}

export class MinimumScheduledEscalationNoticeAdjuster implements ScheduledEscalationNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledEscalationNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledEscalationNoticeAdjuster implements ScheduledEscalationNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledEscalationNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledEscalationNoticeQuantityOffsetAdjuster implements ScheduledEscalationNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ScheduledEscalationNotice, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class CapScheduledEscalationNoticeAdjuster implements ScheduledEscalationNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledEscalationNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledEscalationNoticeAdjuster implements ScheduledEscalationNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledEscalationNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled escalation notice steps in order and keeps a trace of each. */
export class ScheduledEscalationNoticeEngine {
  steps: ScheduledEscalationNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledEscalationNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledEscalationNotice): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledEscalationNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledEscalationNoticeEngine(): ScheduledEscalationNoticeEngine {
  return new ScheduledEscalationNoticeEngine(
    [
      new MinimumScheduledEscalationNoticeAdjuster(23.6),
      new RoundingScheduledEscalationNoticeAdjuster(1),
      new ScheduledEscalationNoticeQuantityOffsetAdjuster(1.3),
      new CapScheduledEscalationNoticeAdjuster(13176),
      new TieredScheduledEscalationNoticeAdjuster([343, 2667], [1.15, 0.97]),
    ],
    [],
    4.8,
    25742.7,
  );
}
