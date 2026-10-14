import * as numbers from "../../../../kit/numbers.js";
import { ScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

/** One step of the scheduled exit rule notice calculation. */
export interface ScheduledExitRuleNoticeAdjuster {
  describe(): string;
  adjust(item: ScheduledExitRuleNotice, value: number): number;
}

export class ScheduledExitRuleNoticeCreatedAtOffsetAdjuster implements ScheduledExitRuleNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ScheduledExitRuleNotice, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class CapScheduledExitRuleNoticeAdjuster implements ScheduledExitRuleNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledExitRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledExitRuleNoticeAdjuster implements ScheduledExitRuleNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledExitRuleNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledExitRuleNoticeAdjuster implements ScheduledExitRuleNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledExitRuleNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledExitRuleNoticeAdjuster implements ScheduledExitRuleNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledExitRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled exit rule notice steps in order and keeps a trace of each. */
export class ScheduledExitRuleNoticeEngine {
  steps: ScheduledExitRuleNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledExitRuleNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledExitRuleNotice): number {
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

  evaluateAll(items: ScheduledExitRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledExitRuleNoticeEngine(): ScheduledExitRuleNoticeEngine {
  return new ScheduledExitRuleNoticeEngine(
    [
      new ScheduledExitRuleNoticeCreatedAtOffsetAdjuster(0.92),
      new CapScheduledExitRuleNoticeAdjuster(8986),
      new RoundingScheduledExitRuleNoticeAdjuster(5),
      new PercentScheduledExitRuleNoticeAdjuster(2.2),
      new MinimumScheduledExitRuleNoticeAdjuster(3.8),
    ],
    [],
    2.1,
    10444.6,
  );
}
