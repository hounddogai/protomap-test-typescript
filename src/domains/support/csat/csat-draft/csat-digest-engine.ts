import { CsatDigest } from "./csat-digest.js";

/** One step of the csat digest calculation. */
export interface CsatDigestStep {
  describe(): string;
  adjust(item: CsatDigest, value: number): number;
}

export class MinimumCsatDigestAdjuster implements CsatDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCsatDigestAdjuster implements CsatDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCsatDigestAdjuster implements CsatDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the csat digest steps in order and keeps a trace of each. */
export class CsatDigestEngine {
  steps: CsatDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatDigest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CsatDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatDigestEngine(): CsatDigestEngine {
  return new CsatDigestEngine(
    [
      new MinimumCsatDigestAdjuster(24.7),
      new PercentCsatDigestAdjuster(22.1),
      new TieredCsatDigestAdjuster([4167, 8162, 8526], [1.18, 1.12, 1.13]),
    ],
    [],
    4.9,
    15741.1,
  );
}
