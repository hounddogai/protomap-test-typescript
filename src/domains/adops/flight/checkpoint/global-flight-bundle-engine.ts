import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFlightBundle } from "./global-flight-bundle.js";

/** One step of the global flight bundle calculation. */
export interface GlobalFlightBundleFactor {
  describe(): string;
  adjust(item: GlobalFlightBundle, value: number): number;
}

export class CapGlobalFlightBundleAdjuster implements GlobalFlightBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalFlightBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalFlightBundleAdjuster implements GlobalFlightBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFlightBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalFlightBundleAdjuster implements GlobalFlightBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalFlightBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredGlobalFlightBundleAdjuster implements GlobalFlightBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalFlightBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalFlightBundleAdjuster implements GlobalFlightBundleFactor {
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

  adjust(item: GlobalFlightBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalFlightBundleAdjuster implements GlobalFlightBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalFlightBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global flight bundle steps in order and keeps a trace of each. */
export class GlobalFlightBundleEngine {
  steps: GlobalFlightBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFlightBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalFlightBundle): number {
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

  evaluateAll(items: GlobalFlightBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalFlightBundleEngine(flagsValue: flags.Registry): GlobalFlightBundleEngine {
  return new GlobalFlightBundleEngine(
    [
      new CapGlobalFlightBundleAdjuster(30201),
      new RoundingGlobalFlightBundleAdjuster(0.5),
      new MinimumGlobalFlightBundleAdjuster(18),
      new TieredGlobalFlightBundleAdjuster([7228, 8539], [1.09, 0.94]),
      new FlaggedGlobalFlightBundleAdjuster(flagsValue, "global-flight-bundle-tiered", -0.2),
      new PercentGlobalFlightBundleAdjuster(7.2),
    ],
    [],
    1.8,
    47768.5,
  );
}
