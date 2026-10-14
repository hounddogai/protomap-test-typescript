import * as numbers from "../../../../kit/numbers.js";
import { LegacyReplyDigest } from "./legacy-reply-digest.js";

/** One step of the legacy reply digest calculation. */
export interface LegacyReplyDigestFactor {
  describe(): string;
  adjust(item: LegacyReplyDigest, value: number): number;
}

export class RoundingLegacyReplyDigestAdjuster implements LegacyReplyDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyReplyDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyReplyDigestAdjuster implements LegacyReplyDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyReplyDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacyReplyDigestAdjuster implements LegacyReplyDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyReplyDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleLegacyReplyDigestAdjuster implements LegacyReplyDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyReplyDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyReplyDigestBidOffsetAdjuster implements LegacyReplyDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: LegacyReplyDigest, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapLegacyReplyDigestAdjuster implements LegacyReplyDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyReplyDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy reply digest steps in order and keeps a trace of each. */
export class LegacyReplyDigestEngine {
  steps: LegacyReplyDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyReplyDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyReplyDigest): number {
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

  evaluateAll(items: LegacyReplyDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyReplyDigestEngine(): LegacyReplyDigestEngine {
  return new LegacyReplyDigestEngine(
    [
      new RoundingLegacyReplyDigestAdjuster(0.5),
      new TieredLegacyReplyDigestAdjuster([4886, 6339], [0.98, 0.9]),
      new MinimumLegacyReplyDigestAdjuster(13.1),
      new LocaleLegacyReplyDigestAdjuster(new Map<string, number>([["south", 0.91]])),
      new LegacyReplyDigestBidOffsetAdjuster(0.43),
      new CapLegacyReplyDigestAdjuster(30215),
    ],
    [],
    1.4,
    49603,
  );
}
