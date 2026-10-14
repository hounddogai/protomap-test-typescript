import { LegacyProofTier } from "./legacy-proof-tier.js";

/** One step of the legacy proof tier calculation. */
export interface LegacyProofTierStep {
  describe(): string;
  adjust(item: LegacyProofTier, value: number): number;
}

export class TieredLegacyProofTierAdjuster implements LegacyProofTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyProofTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLegacyProofTierAdjuster implements LegacyProofTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyProofTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyProofTierAdjuster implements LegacyProofTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyProofTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyProofTierMarginOffsetAdjuster implements LegacyProofTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: LegacyProofTier, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the legacy proof tier steps in order and keeps a trace of each. */
export class LegacyProofTierEngine {
  steps: LegacyProofTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyProofTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyProofTier): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LegacyProofTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyProofTierEngine(): LegacyProofTierEngine {
  return new LegacyProofTierEngine(
    [
      new TieredLegacyProofTierAdjuster([2368, 8839], [1.15, 1.13]),
      new PercentLegacyProofTierAdjuster(-16.7),
      new CapLegacyProofTierAdjuster(16277),
      new LegacyProofTierMarginOffsetAdjuster(1.37),
    ],
    [],
    1.5,
    27169.9,
  );
}
