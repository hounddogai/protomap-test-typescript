import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacySubscriptionWindow } from "./legacy-subscription-window.js";

/** One step of the legacy subscription window calculation. */
export interface LegacySubscriptionWindowStep {
  describe(): string;
  adjust(item: LegacySubscriptionWindow, value: number): number;
}

export class TieredLegacySubscriptionWindowAdjuster implements LegacySubscriptionWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySubscriptionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacySubscriptionWindowAdjuster implements LegacySubscriptionWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacySubscriptionWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacySubscriptionWindowAdjuster implements LegacySubscriptionWindowStep {
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

  adjust(item: LegacySubscriptionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacySubscriptionWindowAdjuster implements LegacySubscriptionWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacySubscriptionWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy subscription window steps in order and keeps a trace of each. */
export class LegacySubscriptionWindowEngine {
  steps: LegacySubscriptionWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySubscriptionWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacySubscriptionWindow): number {
    let current = item.netLoad();
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

  evaluateAll(items: LegacySubscriptionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacySubscriptionWindowEngine(flagsValue: flags.Registry): LegacySubscriptionWindowEngine {
  return new LegacySubscriptionWindowEngine(
    [
      new TieredLegacySubscriptionWindowAdjuster([2243, 3484, 6798, 7259], [1.2, 0.84, 0.82, 0.96]),
      new MinimumLegacySubscriptionWindowAdjuster(17.9),
      new FlaggedLegacySubscriptionWindowAdjuster(flagsValue, "legacy-subscription-window-tiered", -6.6),
      new PercentLegacySubscriptionWindowAdjuster(3.6),
    ],
    [],
    3.4,
    44901.7,
  );
}
