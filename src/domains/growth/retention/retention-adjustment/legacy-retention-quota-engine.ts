import * as numbers from "../../../../kit/numbers.js";
import { LegacyRetentionQuota } from "./legacy-retention-quota.js";

/** One step of the legacy retention quota calculation. */
export interface LegacyRetentionQuotaStep {
  describe(): string;
  adjust(item: LegacyRetentionQuota, value: number): number;
}

export class PercentLegacyRetentionQuotaAdjuster implements LegacyRetentionQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyRetentionQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyRetentionQuotaAdjuster implements LegacyRetentionQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyRetentionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyRetentionQuotaAdjuster implements LegacyRetentionQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyRetentionQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy retention quota steps in order and keeps a trace of each. */
export class LegacyRetentionQuotaEngine {
  steps: LegacyRetentionQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRetentionQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyRetentionQuota): number {
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

  evaluateAll(items: LegacyRetentionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyRetentionQuotaEngine(): LegacyRetentionQuotaEngine {
  return new LegacyRetentionQuotaEngine(
    [
      new PercentLegacyRetentionQuotaAdjuster(-17.3),
      new RoundingLegacyRetentionQuotaAdjuster(0.05),
      new TieredLegacyRetentionQuotaAdjuster([4992, 5051, 5189], [0.88, 0.9, 0.94]),
    ],
    [],
    2.9,
    66642.4,
  );
}
