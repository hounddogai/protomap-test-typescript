import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyException } from "./reply-exception.js";

/** One step of the reply exception calculation. */
export interface ReplyExceptionStep {
  describe(): string;
  adjust(item: ReplyException, value: number): number;
}

export class CapReplyExceptionAdjuster implements ReplyExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedReplyExceptionAdjuster implements ReplyExceptionStep {
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

  adjust(item: ReplyException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentReplyExceptionAdjuster implements ReplyExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryReplyExceptionAdjuster implements ReplyExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ReplyException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredReplyExceptionAdjuster implements ReplyExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumReplyExceptionAdjuster implements ReplyExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reply exception steps in order and keeps a trace of each. */
export class ReplyExceptionEngine {
  steps: ReplyExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyException): number {
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

  evaluateAll(items: ReplyException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyExceptionEngine(flagsValue: flags.Registry): ReplyExceptionEngine {
  return new ReplyExceptionEngine(
    [
      new CapReplyExceptionAdjuster(20512),
      new FlaggedReplyExceptionAdjuster(flagsValue, "reply-exception-adaptive", -9),
      new PercentReplyExceptionAdjuster(9),
      new CategoryReplyExceptionAdjuster(
        new Map<string, number>([["south", 1.23], ["west", 1.08], ["east", 1.05]]),
      ),
      new TieredReplyExceptionAdjuster([2603, 3519], [0.92, 0.93]),
      new MinimumReplyExceptionAdjuster(0.1),
    ],
    [],
    0.6,
    8164.4,
  );
}
