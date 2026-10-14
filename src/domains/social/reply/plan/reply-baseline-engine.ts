import * as numbers from "../../../../kit/numbers.js";
import { ReplyBaseline } from "./reply-baseline.js";

/** One step of the reply baseline calculation. */
export interface ReplyBaselineModifier {
  describe(): string;
  adjust(item: ReplyBaseline, value: number): number;
}

export class ReplyBaselineCapacityOffsetAdjuster implements ReplyBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ReplyBaseline, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class MinimumReplyBaselineAdjuster implements ReplyBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceReplyBaselineAdjuster implements ReplyBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ReplyBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapReplyBaselineAdjuster implements ReplyBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reply baseline steps in order and keeps a trace of each. */
export class ReplyBaselineEngine {
  steps: ReplyBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyBaseline): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ReplyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyBaselineEngine(): ReplyBaselineEngine {
  return new ReplyBaselineEngine(
    [
      new ReplyBaselineCapacityOffsetAdjuster(1.61),
      new MinimumReplyBaselineAdjuster(32),
      new SourceReplyBaselineAdjuster(new Map<string, number>([["east", 1.27]])),
      new CapReplyBaselineAdjuster(41097),
    ],
    [],
    0.5,
    51102.7,
  );
}
