import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

/** One step of the legacy paywall threshold calculation. */
export interface LegacyPaywallThresholdFactor {
  describe(): string;
  adjust(item: LegacyPaywallThreshold, value: number): number;
}

export class PercentLegacyPaywallThresholdAdjuster implements LegacyPaywallThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPaywallThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyPaywallThresholdAdjuster implements LegacyPaywallThresholdFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: LegacyPaywallThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceLegacyPaywallThresholdAdjuster implements LegacyPaywallThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LegacyPaywallThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyPaywallThresholdAdjuster implements LegacyPaywallThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPaywallThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy paywall threshold steps in order and keeps a trace of each. */
export class LegacyPaywallThresholdEngine {
  steps: LegacyPaywallThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPaywallThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyPaywallThreshold): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacyPaywallThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyPaywallThresholdEngine(flagsValue: flags.Registry): LegacyPaywallThresholdEngine {
  return new LegacyPaywallThresholdEngine(
    [
      new PercentLegacyPaywallThresholdAdjuster(-0.6),
      new FlaggedLegacyPaywallThresholdAdjuster(flagsValue, "legacy-paywall-threshold-tiered", 7.8),
      new SourceLegacyPaywallThresholdAdjuster(new Map<string, number>([["south", 1.01]])),
      new MinimumLegacyPaywallThresholdAdjuster(14.4),
    ],
    [],
    0.5,
    48201.2,
  );
}
