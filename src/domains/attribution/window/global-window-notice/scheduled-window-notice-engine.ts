import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWindowNotice } from "./scheduled-window-notice.js";

/** One step of the scheduled window notice calculation. */
export interface ScheduledWindowNoticeModifier {
  describe(): string;
  adjust(item: ScheduledWindowNotice, value: number): number;
}

export class MinimumScheduledWindowNoticeAdjuster implements ScheduledWindowNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWindowNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledWindowNoticeAdjuster implements ScheduledWindowNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWindowNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledWindowNoticeAdjuster implements ScheduledWindowNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWindowNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionScheduledWindowNoticeAdjuster implements ScheduledWindowNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ScheduledWindowNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled window notice steps in order and keeps a trace of each. */
export class ScheduledWindowNoticeEngine {
  steps: ScheduledWindowNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWindowNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledWindowNotice): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ScheduledWindowNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledWindowNoticeEngine(): ScheduledWindowNoticeEngine {
  return new ScheduledWindowNoticeEngine(
    [
      new MinimumScheduledWindowNoticeAdjuster(41.7),
      new RoundingScheduledWindowNoticeAdjuster(0.1),
      new TieredScheduledWindowNoticeAdjuster([2669, 5977, 7760], [1.04, 0.99, 0.9]),
      new RegionScheduledWindowNoticeAdjuster(new Map<string, number>([["north", 0.87], ["online", 0.73]])),
    ],
    [],
    3.9,
    73729.3,
  );
}
