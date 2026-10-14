import { RedemptionManifest } from "./redemption-manifest.js";

/** One step of the redemption manifest calculation. */
export interface RedemptionManifestFactor {
  describe(): string;
  adjust(item: RedemptionManifest, value: number): number;
}

export class PercentRedemptionManifestAdjuster implements RedemptionManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRedemptionManifestAdjuster implements RedemptionManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRedemptionManifestAdjuster implements RedemptionManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleRedemptionManifestAdjuster implements RedemptionManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RedemptionManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the redemption manifest steps in order and keeps a trace of each. */
export class RedemptionManifestEngine {
  steps: RedemptionManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RedemptionManifest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RedemptionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRedemptionManifestEngine(): RedemptionManifestEngine {
  return new RedemptionManifestEngine(
    [
      new PercentRedemptionManifestAdjuster(13.4),
      new TieredRedemptionManifestAdjuster([2449, 3541, 5934, 7114], [0.84, 0.81, 1.09, 0.95]),
      new CapRedemptionManifestAdjuster(1069),
      new TitleRedemptionManifestAdjuster(new Map<string, number>([["north", 0.82], ["central", 1.01]])),
    ],
    [],
    0.9,
    8851.9,
  );
}
