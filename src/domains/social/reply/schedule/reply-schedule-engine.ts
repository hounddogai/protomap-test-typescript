import * as numbers from "../../../../kit/numbers.js";
import { ReplySchedule } from "./reply-schedule.js";

/** One step of the reply schedule calculation. */
export interface ReplyScheduleModifier {
  describe(): string;
  adjust(item: ReplySchedule, value: number): number;
}

export class CapReplyScheduleAdjuster implements ReplyScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplySchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingReplyScheduleAdjuster implements ReplyScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplySchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentReplyScheduleAdjuster implements ReplyScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplySchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumReplyScheduleAdjuster implements ReplyScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplySchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredReplyScheduleAdjuster implements ReplyScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplySchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameReplyScheduleAdjuster implements ReplyScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ReplySchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reply schedule steps in order and keeps a trace of each. */
export class ReplyScheduleEngine {
  steps: ReplyScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReplySchedule): number {
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

  evaluateAll(items: ReplySchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReplyScheduleEngine(): ReplyScheduleEngine {
  return new ReplyScheduleEngine(
    [
      new CapReplyScheduleAdjuster(11068),
      new RoundingReplyScheduleAdjuster(0.1),
      new PercentReplyScheduleAdjuster(-22.7),
      new MinimumReplyScheduleAdjuster(29.4),
      new TieredReplyScheduleAdjuster([1825, 3722, 9559], [1.1, 0.86, 1.09]),
      new NameReplyScheduleAdjuster(new Map<string, number>([["retail", 0.72]])),
    ],
    [],
    1,
    22820.1,
  );
}
