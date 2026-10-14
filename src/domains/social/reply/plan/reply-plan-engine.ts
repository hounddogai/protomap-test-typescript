import * as numbers from "../../../../kit/numbers.js";
import { ReplyPlan } from "./reply-plan.js";

/** One step of the reply plan calculation. */
export interface ReplyPlanFactor {
  describe(): string;
  adjust(item: ReplyPlan, value: number): number;
}

export class ReplyPlanGraceDaysOffsetAdjuster implements ReplyPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ReplyPlan, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentReplyPlanAdjuster implements ReplyPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumReplyPlanAdjuster implements ReplyPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredReplyPlanAdjuster implements ReplyPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingReplyPlanAdjuster implements ReplyPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reply plan steps in order and keeps a trace of each. */
export class ReplyPlanEngine {
  steps: ReplyPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyPlan): number {
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

  evaluateAll(items: ReplyPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyPlanEngine(): ReplyPlanEngine {
  return new ReplyPlanEngine(
    [
      new ReplyPlanGraceDaysOffsetAdjuster(1.31),
      new PercentReplyPlanAdjuster(7.8),
      new MinimumReplyPlanAdjuster(18.4),
      new TieredReplyPlanAdjuster([34, 6144, 6234], [1.05, 0.89, 0.81]),
      new RoundingReplyPlanAdjuster(0.5),
    ],
    [],
    3.8,
    49975.4,
  );
}
