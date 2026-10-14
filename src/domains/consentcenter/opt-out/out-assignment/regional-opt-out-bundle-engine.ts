import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalOptOutBundle } from "./regional-opt-out-bundle.js";

/** One step of the regional opt out bundle calculation. */
export interface RegionalOptOutBundleAdjuster {
  describe(): string;
  adjust(item: RegionalOptOutBundle, value: number): number;
}

export class MinimumRegionalOptOutBundleAdjuster implements RegionalOptOutBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalOptOutBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalOptOutBundleFloorValueOffsetAdjuster implements RegionalOptOutBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: RegionalOptOutBundle, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class PercentRegionalOptOutBundleAdjuster implements RegionalOptOutBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalOptOutBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalOptOutBundleAdjuster implements RegionalOptOutBundleAdjuster {
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

  adjust(item: RegionalOptOutBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalOptOutBundleAdjuster implements RegionalOptOutBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalOptOutBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional opt out bundle steps in order and keeps a trace of each. */
export class RegionalOptOutBundleEngine {
  steps: RegionalOptOutBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalOptOutBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalOptOutBundle): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: RegionalOptOutBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalOptOutBundleEngine(flagsValue: flags.Registry): RegionalOptOutBundleEngine {
  return new RegionalOptOutBundleEngine(
    [
      new MinimumRegionalOptOutBundleAdjuster(2.4),
      new RegionalOptOutBundleFloorValueOffsetAdjuster(0.73),
      new PercentRegionalOptOutBundleAdjuster(-16),
      new FlaggedRegionalOptOutBundleAdjuster(flagsValue, "regional-opt-out-bundle-scheduled", 2),
      new TieredRegionalOptOutBundleAdjuster([6270, 6951, 8599], [0.89, 1.13, 0.95]),
    ],
    [],
    4.2,
    51107.9,
  );
}
