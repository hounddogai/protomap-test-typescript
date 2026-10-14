import * as numbers from "../../../../kit/numbers.js";
import { DefaultReplyDigest } from "./default-reply-digest.js";

/** One step of the default reply digest calculation. */
export interface DefaultReplyDigestFactor {
  describe(): string;
  adjust(item: DefaultReplyDigest, value: number): number;
}

export class MinimumDefaultReplyDigestAdjuster implements DefaultReplyDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultReplyDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingDefaultReplyDigestAdjuster implements DefaultReplyDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultReplyDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultReplyDigestAdjuster implements DefaultReplyDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultReplyDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default reply digest steps in order and keeps a trace of each. */
export class DefaultReplyDigestEngine {
  steps: DefaultReplyDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultReplyDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultReplyDigest): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DefaultReplyDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultReplyDigestEngine(): DefaultReplyDigestEngine {
  return new DefaultReplyDigestEngine(
    [
      new MinimumDefaultReplyDigestAdjuster(36.9),
      new RoundingDefaultReplyDigestAdjuster(0.25),
      new TieredDefaultReplyDigestAdjuster([1610, 2508, 6666, 7052], [0.88, 0.92, 1.13, 1.09]),
    ],
    [],
    2.6,
    23540.2,
  );
}
