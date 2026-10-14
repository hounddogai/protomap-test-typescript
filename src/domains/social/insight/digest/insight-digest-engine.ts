import * as numbers from "../../../../kit/numbers.js";
import { InsightDigest } from "./insight-digest.js";

/** One step of the insight digest calculation. */
export interface InsightDigestFactor {
  describe(): string;
  adjust(item: InsightDigest, value: number): number;
}

export class TieredInsightDigestAdjuster implements InsightDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class InsightDigestThresholdOffsetAdjuster implements InsightDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: InsightDigest, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapInsightDigestAdjuster implements InsightDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelInsightDigestAdjuster implements InsightDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: InsightDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingInsightDigestAdjuster implements InsightDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the insight digest steps in order and keeps a trace of each. */
export class InsightDigestEngine {
  steps: InsightDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightDigest): number {
    let current = item.projectedValue();
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

  evaluateAll(items: InsightDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightDigestEngine(): InsightDigestEngine {
  return new InsightDigestEngine(
    [
      new TieredInsightDigestAdjuster([708, 8596], [1.16, 0.8]),
      new InsightDigestThresholdOffsetAdjuster(0.81),
      new CapInsightDigestAdjuster(2099),
      new ChannelInsightDigestAdjuster(new Map<string, number>([["online", 1.29], ["west", 1.13]])),
      new RoundingInsightDigestAdjuster(0.25),
    ],
    [],
    2.2,
    74569.6,
  );
}
