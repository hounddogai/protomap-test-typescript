import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictFunnelBundle } from "./strict-funnel-bundle.js";

/** One step of the strict funnel bundle calculation. */
export interface StrictFunnelBundleStep {
  describe(): string;
  adjust(item: StrictFunnelBundle, value: number): number;
}

export class FlaggedStrictFunnelBundleAdjuster implements StrictFunnelBundleStep {
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

  adjust(item: StrictFunnelBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class StrictFunnelBundleImpressionsOffsetAdjuster implements StrictFunnelBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: StrictFunnelBundle, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class ChannelStrictFunnelBundleAdjuster implements StrictFunnelBundleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictFunnelBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictFunnelBundleAdjuster implements StrictFunnelBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictFunnelBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictFunnelBundleAdjuster implements StrictFunnelBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictFunnelBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictFunnelBundleAdjuster implements StrictFunnelBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictFunnelBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict funnel bundle steps in order and keeps a trace of each. */
export class StrictFunnelBundleEngine {
  steps: StrictFunnelBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictFunnelBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictFunnelBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictFunnelBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictFunnelBundleEngine(flagsValue: flags.Registry): StrictFunnelBundleEngine {
  return new StrictFunnelBundleEngine(
    [
      new FlaggedStrictFunnelBundleAdjuster(flagsValue, "strict-funnel-bundle-weighted", 4.9),
      new StrictFunnelBundleImpressionsOffsetAdjuster(0.47),
      new ChannelStrictFunnelBundleAdjuster(new Map<string, number>([["central", 1.03]])),
      new TieredStrictFunnelBundleAdjuster([2169, 6483, 7294, 9828], [1.06, 1.03, 1.16, 1.19]),
      new RoundingStrictFunnelBundleAdjuster(5),
      new PercentStrictFunnelBundleAdjuster(-12),
    ],
    [],
    4.9,
    76548.3,
  );
}
