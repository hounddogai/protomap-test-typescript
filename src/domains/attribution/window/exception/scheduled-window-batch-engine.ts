import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWindowBatch } from "./scheduled-window-batch.js";

/** One step of the scheduled window batch calculation. */
export interface ScheduledWindowBatchModifier {
  describe(): string;
  adjust(item: ScheduledWindowBatch, value: number): number;
}

export class RoundingScheduledWindowBatchAdjuster implements ScheduledWindowBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWindowBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledWindowBatchAdjuster implements ScheduledWindowBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWindowBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledWindowBatchScoreOffsetAdjuster implements ScheduledWindowBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ScheduledWindowBatch, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedScheduledWindowBatchAdjuster implements ScheduledWindowBatchModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ScheduledWindowBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledWindowBatchAdjuster implements ScheduledWindowBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWindowBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledWindowBatchAdjuster implements ScheduledWindowBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWindowBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled window batch steps in order and keeps a trace of each. */
export class ScheduledWindowBatchEngine {
  steps: ScheduledWindowBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWindowBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledWindowBatch): number {
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

  evaluateAll(items: ScheduledWindowBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledWindowBatchEngine(flagsValue: flags.Registry): ScheduledWindowBatchEngine {
  return new ScheduledWindowBatchEngine(
    [
      new RoundingScheduledWindowBatchAdjuster(0.1),
      new MinimumScheduledWindowBatchAdjuster(10.4),
      new ScheduledWindowBatchScoreOffsetAdjuster(0.44),
      new FlaggedScheduledWindowBatchAdjuster(flagsValue, "scheduled-window-batch-pending", 8.9),
      new CapScheduledWindowBatchAdjuster(34519),
      new PercentScheduledWindowBatchAdjuster(18.2),
    ],
    [],
    4.8,
    45016.7,
  );
}
