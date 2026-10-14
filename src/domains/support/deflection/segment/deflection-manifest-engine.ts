import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionManifest } from "./deflection-manifest.js";

/** One step of the deflection manifest calculation. */
export interface DeflectionManifestFactor {
  describe(): string;
  adjust(item: DeflectionManifest, value: number): number;
}

export class DeflectionManifestBidOffsetAdjuster implements DeflectionManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: DeflectionManifest, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class FlaggedDeflectionManifestAdjuster implements DeflectionManifestFactor {
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

  adjust(item: DeflectionManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDeflectionManifestAdjuster implements DeflectionManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDeflectionManifestAdjuster implements DeflectionManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceDeflectionManifestAdjuster implements DeflectionManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DeflectionManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentDeflectionManifestAdjuster implements DeflectionManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the deflection manifest steps in order and keeps a trace of each. */
export class DeflectionManifestEngine {
  steps: DeflectionManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionManifest): number {
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

  evaluateAll(items: DeflectionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionManifestEngine(flagsValue: flags.Registry): DeflectionManifestEngine {
  return new DeflectionManifestEngine(
    [
      new DeflectionManifestBidOffsetAdjuster(0.76),
      new FlaggedDeflectionManifestAdjuster(flagsValue, "deflection-manifest-legacy", 6.5),
      new MinimumDeflectionManifestAdjuster(20.6),
      new CapDeflectionManifestAdjuster(17799),
      new UtmSourceDeflectionManifestAdjuster(new Map<string, number>([["central", 0.7]])),
      new PercentDeflectionManifestAdjuster(-14.4),
    ],
    [],
    2,
    86976,
  );
}
