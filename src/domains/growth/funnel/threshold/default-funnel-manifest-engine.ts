import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultFunnelManifest } from "./default-funnel-manifest.js";

/** One step of the default funnel manifest calculation. */
export interface DefaultFunnelManifestFactor {
  describe(): string;
  adjust(item: DefaultFunnelManifest, value: number): number;
}

export class FlaggedDefaultFunnelManifestAdjuster implements DefaultFunnelManifestFactor {
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

  adjust(item: DefaultFunnelManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultFunnelManifestAdjuster implements DefaultFunnelManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultFunnelManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultFunnelManifestAdjuster implements DefaultFunnelManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultFunnelManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameDefaultFunnelManifestAdjuster implements DefaultFunnelManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultFunnelManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default funnel manifest steps in order and keeps a trace of each. */
export class DefaultFunnelManifestEngine {
  steps: DefaultFunnelManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFunnelManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultFunnelManifest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultFunnelManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultFunnelManifestEngine(flagsValue: flags.Registry): DefaultFunnelManifestEngine {
  return new DefaultFunnelManifestEngine(
    [
      new FlaggedDefaultFunnelManifestAdjuster(flagsValue, "default-funnel-manifest-default", -4.5),
      new TieredDefaultFunnelManifestAdjuster([464, 972, 4580], [1.06, 0.87, 0.94]),
      new MinimumDefaultFunnelManifestAdjuster(32.7),
      new NameDefaultFunnelManifestAdjuster(
        new Map<string, number>([["retail", 1.19], ["online", 1.22], ["west", 0.92]]),
      ),
    ],
    [],
    1.2,
    74388,
  );
}
