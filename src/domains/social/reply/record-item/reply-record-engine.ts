import * as numbers from "../../../../kit/numbers.js";
import { ReplyRecord } from "./reply-record.js";

/** One step of the reply record calculation. */
export interface ReplyRecordAdjuster {
  describe(): string;
  adjust(item: ReplyRecord, value: number): number;
}

export class CapReplyRecordAdjuster implements ReplyRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryReplyRecordAdjuster implements ReplyRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ReplyRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumReplyRecordAdjuster implements ReplyRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentReplyRecordAdjuster implements ReplyRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyRecordAdjuster implements ReplyRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reply record steps in order and keeps a trace of each. */
export class ReplyRecordEngine {
  steps: ReplyRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyRecord): number {
    let current = item.netTotal();
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

  evaluateAll(items: ReplyRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyRecordEngine(): ReplyRecordEngine {
  return new ReplyRecordEngine(
    [
      new CapReplyRecordAdjuster(4509),
      new CountryReplyRecordAdjuster(
        new Map<string, number>([["online", 1.07], ["south", 0.82], ["east", 1.12]]),
      ),
      new MinimumReplyRecordAdjuster(3),
      new PercentReplyRecordAdjuster(12.9),
      new TieredReplyRecordAdjuster([98, 2016], [0.82, 0.91]),
    ],
    [],
    4.7,
    57188.1,
  );
}
