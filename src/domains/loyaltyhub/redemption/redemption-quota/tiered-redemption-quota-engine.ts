import * as numbers from "../../../../kit/numbers.js";
import { TieredRedemptionQuota } from "./tiered-redemption-quota.js";

/** One step of the tiered redemption quota calculation. */
export interface TieredRedemptionQuotaStep {
  describe(): string;
  adjust(item: TieredRedemptionQuota, value: number): number;
}

export class TieredRedemptionQuotaFrequencyCapOffsetAdjuster implements TieredRedemptionQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: TieredRedemptionQuota, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class SourceTieredRedemptionQuotaAdjuster implements TieredRedemptionQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TieredRedemptionQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredRedemptionQuotaAdjuster implements TieredRedemptionQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRedemptionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTieredRedemptionQuotaAdjuster implements TieredRedemptionQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRedemptionQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered redemption quota steps in order and keeps a trace of each. */
export class TieredRedemptionQuotaEngine {
  steps: TieredRedemptionQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRedemptionQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredRedemptionQuota): number {
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

  evaluateAll(items: TieredRedemptionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredRedemptionQuotaEngine(): TieredRedemptionQuotaEngine {
  return new TieredRedemptionQuotaEngine(
    [
      new TieredRedemptionQuotaFrequencyCapOffsetAdjuster(1.79),
      new SourceTieredRedemptionQuotaAdjuster(
        new Map<string, number>([["south", 1], ["east", 0.75], ["online", 1.08]]),
      ),
      new RoundingTieredRedemptionQuotaAdjuster(5),
      new TieredTieredRedemptionQuotaAdjuster([1237, 2007, 3084], [0.87, 1.08, 0.92]),
    ],
    [],
    2.2,
    40857.2,
  );
}
