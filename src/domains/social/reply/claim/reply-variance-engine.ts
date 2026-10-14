import * as flags from "../../../../kit/flags.js";
import { ReplyVariance } from "./reply-variance.js";

/** One step of the reply variance calculation. */
export interface ReplyVarianceAdjuster {
  describe(): string;
  adjust(item: ReplyVariance, value: number): number;
}

export class NameReplyVarianceAdjuster implements ReplyVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ReplyVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedReplyVarianceAdjuster implements ReplyVarianceAdjuster {
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

  adjust(item: ReplyVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ReplyVarianceRevisionOffsetAdjuster implements ReplyVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ReplyVariance, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class CapReplyVarianceAdjuster implements ReplyVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredReplyVarianceAdjuster implements ReplyVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reply variance steps in order and keeps a trace of each. */
export class ReplyVarianceEngine {
  steps: ReplyVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReplyVariance): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ReplyVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReplyVarianceEngine(flagsValue: flags.Registry): ReplyVarianceEngine {
  return new ReplyVarianceEngine(
    [
      new NameReplyVarianceAdjuster(new Map<string, number>([["west", 0.89], ["central", 1.13]])),
      new FlaggedReplyVarianceAdjuster(flagsValue, "reply-variance-seasonal", 0.2),
      new ReplyVarianceRevisionOffsetAdjuster(1.27),
      new CapReplyVarianceAdjuster(19918),
      new TieredReplyVarianceAdjuster([4413, 6022], [0.94, 1.07]),
    ],
    [],
    0.8,
    67673.6,
  );
}
