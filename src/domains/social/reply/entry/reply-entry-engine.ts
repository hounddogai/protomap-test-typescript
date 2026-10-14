import * as numbers from "../../../../kit/numbers.js";
import { ReplyEntry } from "./reply-entry.js";

/** One step of the reply entry calculation. */
export interface ReplyEntryFactor {
  describe(): string;
  adjust(item: ReplyEntry, value: number): number;
}

export class ReplyEntryScoreOffsetAdjuster implements ReplyEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ReplyEntry, value: number): number {
    return value + item.score * this.weight;
  }
}

export class RoundingReplyEntryAdjuster implements ReplyEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapReplyEntryAdjuster implements ReplyEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredReplyEntryAdjuster implements ReplyEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reply entry steps in order and keeps a trace of each. */
export class ReplyEntryEngine {
  steps: ReplyEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyEntry): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ReplyEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyEntryEngine(): ReplyEntryEngine {
  return new ReplyEntryEngine(
    [
      new ReplyEntryScoreOffsetAdjuster(1.05),
      new RoundingReplyEntryAdjuster(0.25),
      new CapReplyEntryAdjuster(19667),
      new TieredReplyEntryAdjuster([5110, 6271, 7945, 7978], [0.92, 0.87, 1.11, 1.15]),
    ],
    [],
    1.6,
    94878,
  );
}
