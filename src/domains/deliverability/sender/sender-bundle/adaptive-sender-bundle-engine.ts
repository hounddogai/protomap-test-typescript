import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveSenderBundle } from "./adaptive-sender-bundle.js";

/** One step of the adaptive sender bundle calculation. */
export interface AdaptiveSenderBundleAdjuster {
  describe(): string;
  adjust(item: AdaptiveSenderBundle, value: number): number;
}

export class AdaptiveSenderBundleDiscountOffsetAdjuster implements AdaptiveSenderBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: AdaptiveSenderBundle, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedAdaptiveSenderBundleAdjuster implements AdaptiveSenderBundleAdjuster {
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

  adjust(item: AdaptiveSenderBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveSenderBundleAdjuster implements AdaptiveSenderBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSenderBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveSenderBundleAdjuster implements AdaptiveSenderBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveSenderBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive sender bundle steps in order and keeps a trace of each. */
export class AdaptiveSenderBundleEngine {
  steps: AdaptiveSenderBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSenderBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveSenderBundle): number {
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

  evaluateAll(items: AdaptiveSenderBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveSenderBundleEngine(flagsValue: flags.Registry): AdaptiveSenderBundleEngine {
  return new AdaptiveSenderBundleEngine(
    [
      new AdaptiveSenderBundleDiscountOffsetAdjuster(1.44),
      new FlaggedAdaptiveSenderBundleAdjuster(flagsValue, "adaptive-sender-bundle-regional", 9),
      new PercentAdaptiveSenderBundleAdjuster(-0.2),
      new MinimumAdaptiveSenderBundleAdjuster(6.7),
    ],
    [],
    2.2,
    87430,
  );
}
