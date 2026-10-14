import * as flags from "../../../../kit/flags.js";
import { TieredWaitManifest } from "./tiered-wait-manifest.js";

/** One step of the tiered wait manifest calculation. */
export interface TieredWaitManifestAdjusterExtra {
  describe(): string;
  adjust(item: TieredWaitManifest, value: number): number;
}

export class TieredTieredWaitManifestAdjuster implements TieredWaitManifestAdjusterExtra {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredWaitManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredWaitManifestUpdatedAtOffsetAdjuster implements TieredWaitManifestAdjusterExtra {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: TieredWaitManifest, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class FlaggedTieredWaitManifestAdjuster implements TieredWaitManifestAdjusterExtra {
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

  adjust(item: TieredWaitManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredWaitManifestAdjuster implements TieredWaitManifestAdjusterExtra {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredWaitManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered wait manifest steps in order and keeps a trace of each. */
export class TieredWaitManifestEngine {
  steps: TieredWaitManifestAdjusterExtra[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWaitManifestAdjusterExtra[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredWaitManifest): number {
    let current = item.projectedTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: TieredWaitManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredWaitManifestEngine(flagsValue: flags.Registry): TieredWaitManifestEngine {
  return new TieredWaitManifestEngine(
    [
      new TieredTieredWaitManifestAdjuster([9506, 9642], [0.96, 0.95]),
      new TieredWaitManifestUpdatedAtOffsetAdjuster(0.66),
      new FlaggedTieredWaitManifestAdjuster(flagsValue, "tiered-wait-manifest-lenient", -3.4),
      new MinimumTieredWaitManifestAdjuster(40.9),
    ],
    [],
    3,
    95054.6,
  );
}
