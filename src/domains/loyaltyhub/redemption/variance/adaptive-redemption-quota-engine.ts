import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

/** One step of the adaptive redemption quota calculation. */
export interface AdaptiveRedemptionQuotaStep {
  describe(): string;
  adjust(item: AdaptiveRedemptionQuota, value: number): number;
}

export class RoundingAdaptiveRedemptionQuotaAdjuster implements AdaptiveRedemptionQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveRedemptionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveRedemptionQuotaOpenRateOffsetAdjuster implements AdaptiveRedemptionQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: AdaptiveRedemptionQuota, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumAdaptiveRedemptionQuotaAdjuster implements AdaptiveRedemptionQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveRedemptionQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive redemption quota steps in order and keeps a trace of each. */
export class AdaptiveRedemptionQuotaEngine {
  steps: AdaptiveRedemptionQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveRedemptionQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveRedemptionQuota): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: AdaptiveRedemptionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveRedemptionQuotaEngine(): AdaptiveRedemptionQuotaEngine {
  return new AdaptiveRedemptionQuotaEngine(
    [
      new RoundingAdaptiveRedemptionQuotaAdjuster(0.05),
      new AdaptiveRedemptionQuotaOpenRateOffsetAdjuster(1.79),
      new MinimumAdaptiveRedemptionQuotaAdjuster(47.5),
    ],
    [],
    2.9,
    45640.5,
  );
}
