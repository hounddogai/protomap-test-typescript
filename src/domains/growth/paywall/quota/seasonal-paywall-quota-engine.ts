import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

/** One step of the seasonal paywall quota calculation. */
export interface SeasonalPaywallQuotaModifier {
  describe(): string;
  adjust(item: SeasonalPaywallQuota, value: number): number;
}

export class MinimumSeasonalPaywallQuotaAdjuster implements SeasonalPaywallQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPaywallQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelSeasonalPaywallQuotaAdjuster implements SeasonalPaywallQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SeasonalPaywallQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSeasonalPaywallQuotaAdjuster implements SeasonalPaywallQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalPaywallQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalPaywallQuotaAdjuster implements SeasonalPaywallQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalPaywallQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal paywall quota steps in order and keeps a trace of each. */
export class SeasonalPaywallQuotaEngine {
  steps: SeasonalPaywallQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPaywallQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalPaywallQuota): number {
    let current = item.netVolume();
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

  evaluateAll(items: SeasonalPaywallQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalPaywallQuotaEngine(): SeasonalPaywallQuotaEngine {
  return new SeasonalPaywallQuotaEngine(
    [
      new MinimumSeasonalPaywallQuotaAdjuster(34.3),
      new LabelSeasonalPaywallQuotaAdjuster(
        new Map<string, number>([["online", 1.1], ["retail", 0.99], ["west", 1.25]]),
      ),
      new CapSeasonalPaywallQuotaAdjuster(34558),
      new RoundingSeasonalPaywallQuotaAdjuster(0.25),
    ],
    [],
    3.4,
    45710.4,
  );
}
