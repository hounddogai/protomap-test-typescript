import * as flags from "../../../../kit/flags.js";
import { ReplyForecast } from "./reply-forecast.js";

/** One step of the reply forecast calculation. */
export interface ReplyForecastModifier {
  describe(): string;
  adjust(item: ReplyForecast, value: number): number;
}

export class FlaggedReplyForecastAdjuster implements ReplyForecastModifier {
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

  adjust(item: ReplyForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapReplyForecastAdjuster implements ReplyForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelReplyForecastAdjuster implements ReplyForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReplyForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reply forecast steps in order and keeps a trace of each. */
export class ReplyForecastEngine {
  steps: ReplyForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyForecast): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ReplyForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyForecastEngine(flagsValue: flags.Registry): ReplyForecastEngine {
  return new ReplyForecastEngine(
    [
      new FlaggedReplyForecastAdjuster(flagsValue, "reply-forecast-legacy", 9.4),
      new CapReplyForecastAdjuster(33753),
      new LabelReplyForecastAdjuster(
        new Map<string, number>([["east", 1.18], ["retail", 1.21], ["south", 0.88]]),
      ),
    ],
    [],
    3.7,
    58770.2,
  );
}
