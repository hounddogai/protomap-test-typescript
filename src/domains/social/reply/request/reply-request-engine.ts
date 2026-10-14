import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyRequest } from "./reply-request.js";

/** One step of the reply request calculation. */
export interface ReplyRequestStep {
  describe(): string;
  adjust(item: ReplyRequest, value: number): number;
}

export class RoundingReplyRequestAdjuster implements ReplyRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedReplyRequestAdjuster implements ReplyRequestStep {
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

  adjust(item: ReplyRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleReplyRequestAdjuster implements ReplyRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ReplyRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumReplyRequestAdjuster implements ReplyRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapReplyRequestAdjuster implements ReplyRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reply request steps in order and keeps a trace of each. */
export class ReplyRequestEngine {
  steps: ReplyRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyRequest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ReplyRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyRequestEngine(flagsValue: flags.Registry): ReplyRequestEngine {
  return new ReplyRequestEngine(
    [
      new RoundingReplyRequestAdjuster(0.25),
      new FlaggedReplyRequestAdjuster(flagsValue, "reply-request-strict", -6.9),
      new TitleReplyRequestAdjuster(
        new Map<string, number>([["east", 1.26], ["online", 1.02], ["south", 0.94]]),
      ),
      new MinimumReplyRequestAdjuster(41.5),
      new CapReplyRequestAdjuster(2426),
    ],
    [],
    4.7,
    48906.9,
  );
}
