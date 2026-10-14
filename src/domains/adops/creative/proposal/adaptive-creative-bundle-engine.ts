import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCreativeBundle } from "./adaptive-creative-bundle.js";

/** One step of the adaptive creative bundle calculation. */
export interface AdaptiveCreativeBundleAdjuster {
  describe(): string;
  adjust(item: AdaptiveCreativeBundle, value: number): number;
}

export class MinimumAdaptiveCreativeBundleAdjuster implements AdaptiveCreativeBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveCreativeBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveCreativeBundleAdjuster implements AdaptiveCreativeBundleAdjuster {
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

  adjust(item: AdaptiveCreativeBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveCreativeBundleAdjuster implements AdaptiveCreativeBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCreativeBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceAdaptiveCreativeBundleAdjuster implements AdaptiveCreativeBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: AdaptiveCreativeBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive creative bundle steps in order and keeps a trace of each. */
export class AdaptiveCreativeBundleEngine {
  steps: AdaptiveCreativeBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCreativeBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveCreativeBundle): number {
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

  evaluateAll(items: AdaptiveCreativeBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveCreativeBundleEngine(flagsValue: flags.Registry): AdaptiveCreativeBundleEngine {
  return new AdaptiveCreativeBundleEngine(
    [
      new MinimumAdaptiveCreativeBundleAdjuster(19.8),
      new FlaggedAdaptiveCreativeBundleAdjuster(flagsValue, "adaptive-creative-bundle-manual", -9.2),
      new TieredAdaptiveCreativeBundleAdjuster([8920, 9315], [0.98, 0.98]),
      new SourceAdaptiveCreativeBundleAdjuster(new Map<string, number>([["online", 1.37], ["retail", 1.07]])),
    ],
    [],
    2.1,
    69516.5,
  );
}
