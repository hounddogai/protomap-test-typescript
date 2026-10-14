import * as numbers from "../../../../kit/numbers.js";
import { FrequencyQuota } from "./frequency-quota.js";

/** One step of the frequency quota calculation. */
export interface FrequencyQuotaStep {
  describe(): string;
  adjust(item: FrequencyQuota, value: number): number;
}

export class PercentFrequencyQuotaAdjuster implements FrequencyQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFrequencyQuotaAdjuster implements FrequencyQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelFrequencyQuotaAdjuster implements FrequencyQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FrequencyQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFrequencyQuotaAdjuster implements FrequencyQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the frequency quota steps in order and keeps a trace of each. */
export class FrequencyQuotaEngine {
  steps: FrequencyQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FrequencyQuota): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FrequencyQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFrequencyQuotaEngine(): FrequencyQuotaEngine {
  return new FrequencyQuotaEngine(
    [
      new PercentFrequencyQuotaAdjuster(9.4),
      new CapFrequencyQuotaAdjuster(11006),
      new ChannelFrequencyQuotaAdjuster(
        new Map<string, number>([["east", 0.75], ["north", 1.31], ["online", 1.07]]),
      ),
      new RoundingFrequencyQuotaAdjuster(0.5),
    ],
    [],
    2.1,
    63113.3,
  );
}
