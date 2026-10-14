import * as numbers from "../../../../kit/numbers.js";
import { LenientQueueNotice } from "./lenient-queue-notice.js";

/** One step of the lenient queue notice calculation. */
export interface LenientQueueNoticeAdjuster {
  describe(): string;
  adjust(item: LenientQueueNotice, value: number): number;
}

export class MinimumLenientQueueNoticeAdjuster implements LenientQueueNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientQueueNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientQueueNoticeAdjuster implements LenientQueueNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientQueueNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientQueueNoticeAdjuster implements LenientQueueNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientQueueNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient queue notice steps in order and keeps a trace of each. */
export class LenientQueueNoticeEngine {
  steps: LenientQueueNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientQueueNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientQueueNotice): number {
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

  evaluateAll(items: LenientQueueNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientQueueNoticeEngine(): LenientQueueNoticeEngine {
  return new LenientQueueNoticeEngine(
    [
      new MinimumLenientQueueNoticeAdjuster(11.6),
      new PercentLenientQueueNoticeAdjuster(10.1),
      new TieredLenientQueueNoticeAdjuster([3592, 5579, 8958, 9559], [1.11, 1.05, 1.07, 1.11]),
    ],
    [],
    1.4,
    60416.3,
  );
}
