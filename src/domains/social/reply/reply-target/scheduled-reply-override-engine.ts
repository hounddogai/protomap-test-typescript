import * as numbers from "../../../../kit/numbers.js";
import { ScheduledReplyOverride } from "./scheduled-reply-override.js";

/** One step of the scheduled reply override calculation. */
export interface ScheduledReplyOverrideAdjuster {
  describe(): string;
  adjust(item: ScheduledReplyOverride, value: number): number;
}

export class PercentScheduledReplyOverrideAdjuster implements ScheduledReplyOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledReplyOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledReplyOverrideAdjuster implements ScheduledReplyOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledReplyOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledReplyOverrideAdjuster implements ScheduledReplyOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledReplyOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledReplyOverrideBudgetOffsetAdjuster implements ScheduledReplyOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ScheduledReplyOverride, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the scheduled reply override steps in order and keeps a trace of each. */
export class ScheduledReplyOverrideEngine {
  steps: ScheduledReplyOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledReplyOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledReplyOverride): number {
    let current = item.netValue();
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

  evaluateAll(items: ScheduledReplyOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledReplyOverrideEngine(): ScheduledReplyOverrideEngine {
  return new ScheduledReplyOverrideEngine(
    [
      new PercentScheduledReplyOverrideAdjuster(-18.8),
      new MinimumScheduledReplyOverrideAdjuster(37.1),
      new RoundingScheduledReplyOverrideAdjuster(0.25),
      new ScheduledReplyOverrideBudgetOffsetAdjuster(0.54),
    ],
    [],
    4.7,
    93345.6,
  );
}
