import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveComplaintBundle } from "./adaptive-complaint-bundle.js";

/** One step of the adaptive complaint bundle calculation. */
export interface AdaptiveComplaintBundleFactor {
  describe(): string;
  adjust(item: AdaptiveComplaintBundle, value: number): number;
}

export class AdaptiveComplaintBundleConversionRateOffsetAdjuster implements AdaptiveComplaintBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: AdaptiveComplaintBundle, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class FlaggedAdaptiveComplaintBundleAdjuster implements AdaptiveComplaintBundleFactor {
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

  adjust(item: AdaptiveComplaintBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveComplaintBundleAdjuster implements AdaptiveComplaintBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveComplaintBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveComplaintBundleAdjuster implements AdaptiveComplaintBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveComplaintBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelAdaptiveComplaintBundleAdjuster implements AdaptiveComplaintBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveComplaintBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveComplaintBundleAdjuster implements AdaptiveComplaintBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveComplaintBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive complaint bundle steps in order and keeps a trace of each. */
export class AdaptiveComplaintBundleEngine {
  steps: AdaptiveComplaintBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveComplaintBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveComplaintBundle): number {
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

  evaluateAll(items: AdaptiveComplaintBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveComplaintBundleEngine(flagsValue: flags.Registry): AdaptiveComplaintBundleEngine {
  return new AdaptiveComplaintBundleEngine(
    [
      new AdaptiveComplaintBundleConversionRateOffsetAdjuster(0.76),
      new FlaggedAdaptiveComplaintBundleAdjuster(flagsValue, "adaptive-complaint-bundle-batched", 4.9),
      new TieredAdaptiveComplaintBundleAdjuster([667, 5155, 9111], [1.02, 0.83, 1.07]),
      new RoundingAdaptiveComplaintBundleAdjuster(1),
      new ChannelAdaptiveComplaintBundleAdjuster(new Map<string, number>([["central", 1.38], ["retail", 0.93]])),
      new CapAdaptiveComplaintBundleAdjuster(14972),
    ],
    [],
    1.6,
    10911.1,
  );
}
