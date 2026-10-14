import * as numbers from "../../../../kit/numbers.js";
import { CreativeQuota } from "./creative-quota.js";

/** One step of the creative quota calculation. */
export interface CreativeQuotaFactor {
  describe(): string;
  adjust(item: CreativeQuota, value: number): number;
}

export class ChannelCreativeQuotaAdjuster implements CreativeQuotaFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CreativeQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CreativeQuotaConversionRateOffsetAdjuster implements CreativeQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: CreativeQuota, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class RoundingCreativeQuotaAdjuster implements CreativeQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCreativeQuotaAdjuster implements CreativeQuotaFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the creative quota steps in order and keeps a trace of each. */
export class CreativeQuotaEngine {
  steps: CreativeQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeQuota): number {
    let current = item.netVolume();
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

  evaluateAll(items: CreativeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeQuotaEngine(): CreativeQuotaEngine {
  return new CreativeQuotaEngine(
    [
      new ChannelCreativeQuotaAdjuster(
        new Map<string, number>([["south", 0.81], ["retail", 1.25], ["west", 0.76]]),
      ),
      new CreativeQuotaConversionRateOffsetAdjuster(0.57),
      new RoundingCreativeQuotaAdjuster(0.05),
      new TieredCreativeQuotaAdjuster([2365, 7894, 8798], [0.83, 1.08, 1]),
    ],
    [],
    3.8,
    73893.7,
  );
}
