import { TieredSenderDigest } from "./tiered-sender-digest.js";

/** One step of the tiered sender digest calculation. */
export interface TieredSenderDigestStep {
  describe(): string;
  adjust(item: TieredSenderDigest, value: number): number;
}

export class MinimumTieredSenderDigestAdjuster implements TieredSenderDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredSenderDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredSenderDigestAdjuster implements TieredSenderDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSenderDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredSenderDigestAdjuster implements TieredSenderDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredSenderDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered sender digest steps in order and keeps a trace of each. */
export class TieredSenderDigestEngine {
  steps: TieredSenderDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSenderDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredSenderDigest): number {
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

  evaluateAll(items: TieredSenderDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredSenderDigestEngine(): TieredSenderDigestEngine {
  return new TieredSenderDigestEngine(
    [
      new MinimumTieredSenderDigestAdjuster(1.5),
      new TieredTieredSenderDigestAdjuster([610, 1640, 7827, 9830], [0.92, 1.14, 0.93, 0.82]),
      new PercentTieredSenderDigestAdjuster(10.1),
    ],
    [],
    3.5,
    93798,
  );
}
