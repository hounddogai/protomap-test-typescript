import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveEnrollmentQuota } from "./adaptive-enrollment-quota.js";

/** One step of the adaptive enrollment quota calculation. */
export interface AdaptiveEnrollmentQuotaModifier {
  describe(): string;
  adjust(item: AdaptiveEnrollmentQuota, value: number): number;
}

export class AdaptiveEnrollmentQuotaImpressionsOffsetAdjuster implements AdaptiveEnrollmentQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: AdaptiveEnrollmentQuota, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredAdaptiveEnrollmentQuotaAdjuster implements AdaptiveEnrollmentQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveEnrollmentQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentAdaptiveEnrollmentQuotaAdjuster implements AdaptiveEnrollmentQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveEnrollmentQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveEnrollmentQuotaAdjuster implements AdaptiveEnrollmentQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveEnrollmentQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive enrollment quota steps in order and keeps a trace of each. */
export class AdaptiveEnrollmentQuotaEngine {
  steps: AdaptiveEnrollmentQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveEnrollmentQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveEnrollmentQuota): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: AdaptiveEnrollmentQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveEnrollmentQuotaEngine(): AdaptiveEnrollmentQuotaEngine {
  return new AdaptiveEnrollmentQuotaEngine(
    [
      new AdaptiveEnrollmentQuotaImpressionsOffsetAdjuster(0.03),
      new TieredAdaptiveEnrollmentQuotaAdjuster([4558, 5739, 8991], [0.82, 1.11, 1.08]),
      new PercentAdaptiveEnrollmentQuotaAdjuster(-14.7),
      new RoundingAdaptiveEnrollmentQuotaAdjuster(0.1),
    ],
    [],
    0.9,
    88477.4,
  );
}
