import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalTierManifest } from "./global-tier-manifest.js";

/** One step of the global tier manifest calculation. */
export interface GlobalTierManifestModifier {
  describe(): string;
  adjust(item: GlobalTierManifest, value: number): number;
}

export class RoundingGlobalTierManifestAdjuster implements GlobalTierManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalTierManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalTierManifestAdjuster implements GlobalTierManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalTierManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedGlobalTierManifestAdjuster implements GlobalTierManifestModifier {
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

  adjust(item: GlobalTierManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalTierManifestAdjuster implements GlobalTierManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalTierManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalTierManifestAdjuster implements GlobalTierManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalTierManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global tier manifest steps in order and keeps a trace of each. */
export class GlobalTierManifestEngine {
  steps: GlobalTierManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalTierManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalTierManifest): number {
    let current = item.projectedValue();
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

  evaluateAll(items: GlobalTierManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalTierManifestEngine(flagsValue: flags.Registry): GlobalTierManifestEngine {
  return new GlobalTierManifestEngine(
    [
      new RoundingGlobalTierManifestAdjuster(0.5),
      new MinimumGlobalTierManifestAdjuster(47.8),
      new FlaggedGlobalTierManifestAdjuster(flagsValue, "global-tier-manifest-tiered", 1.8),
      new CapGlobalTierManifestAdjuster(43426),
      new TieredGlobalTierManifestAdjuster([161, 4361, 7502, 9255], [0.92, 0.9, 1.13, 0.83]),
    ],
    [],
    0.2,
    14000.6,
  );
}
