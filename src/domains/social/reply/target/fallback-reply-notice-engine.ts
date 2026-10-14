import * as numbers from "../../../../kit/numbers.js";
import { FallbackReplyNotice } from "./fallback-reply-notice.js";

/** One step of the fallback reply notice calculation. */
export interface FallbackReplyNoticeStep {
  describe(): string;
  adjust(item: FallbackReplyNotice, value: number): number;
}

export class CapFallbackReplyNoticeAdjuster implements FallbackReplyNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackReplyNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackReplyNoticeAdjuster implements FallbackReplyNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackReplyNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FallbackReplyNoticeUpdatedAtOffsetAdjuster implements FallbackReplyNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: FallbackReplyNotice, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the fallback reply notice steps in order and keeps a trace of each. */
export class FallbackReplyNoticeEngine {
  steps: FallbackReplyNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackReplyNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackReplyNotice): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: FallbackReplyNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackReplyNoticeEngine(): FallbackReplyNoticeEngine {
  return new FallbackReplyNoticeEngine(
    [
      new CapFallbackReplyNoticeAdjuster(35754),
      new TieredFallbackReplyNoticeAdjuster([1088, 1247, 4802, 6874], [1.01, 0.82, 1.03, 0.88]),
      new FallbackReplyNoticeUpdatedAtOffsetAdjuster(0.78),
    ],
    [],
    3.7,
    97649.2,
  );
}
