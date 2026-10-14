import { LenientSenderDigest } from "./lenient-sender-digest.js";

/** One step of the lenient sender digest calculation. */
export interface LenientSenderDigestAdjuster {
  describe(): string;
  adjust(item: LenientSenderDigest, value: number): number;
}

export class MinimumLenientSenderDigestAdjuster implements LenientSenderDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientSenderDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientSenderDigestAdjuster implements LenientSenderDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientSenderDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientSenderDigestAdjuster implements LenientSenderDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientSenderDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient sender digest steps in order and keeps a trace of each. */
export class LenientSenderDigestEngine {
  steps: LenientSenderDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSenderDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientSenderDigest): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LenientSenderDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientSenderDigestEngine(): LenientSenderDigestEngine {
  return new LenientSenderDigestEngine(
    [
      new MinimumLenientSenderDigestAdjuster(1.8),
      new TieredLenientSenderDigestAdjuster([3766, 6423, 8458, 9914], [1.08, 1.06, 1.05, 1.02]),
      new PercentLenientSenderDigestAdjuster(-4.8),
    ],
    [],
    2.8,
    64127.6,
  );
}
