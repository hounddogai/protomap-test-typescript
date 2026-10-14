import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInManifest } from "./double-opt-in-manifest.js";

/** One step of the double opt in manifest calculation. */
export interface DoubleOptInManifestFactor {
  describe(): string;
  adjust(item: DoubleOptInManifest, value: number): number;
}

export class DoubleOptInManifestPriorityOffsetAdjuster implements DoubleOptInManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: DoubleOptInManifest, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedDoubleOptInManifestAdjuster implements DoubleOptInManifestFactor {
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

  adjust(item: DoubleOptInManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDoubleOptInManifestAdjuster implements DoubleOptInManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceDoubleOptInManifestAdjuster implements DoubleOptInManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DoubleOptInManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDoubleOptInManifestAdjuster implements DoubleOptInManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDoubleOptInManifestAdjuster implements DoubleOptInManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the double opt in manifest steps in order and keeps a trace of each. */
export class DoubleOptInManifestEngine {
  steps: DoubleOptInManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInManifest): number {
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

  evaluateAll(items: DoubleOptInManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInManifestEngine(flagsValue: flags.Registry): DoubleOptInManifestEngine {
  return new DoubleOptInManifestEngine(
    [
      new DoubleOptInManifestPriorityOffsetAdjuster(0.81),
      new FlaggedDoubleOptInManifestAdjuster(flagsValue, "double-opt-in-manifest-seasonal", -3.7),
      new TieredDoubleOptInManifestAdjuster([8083, 8503], [1.1, 0.87]),
      new UtmSourceDoubleOptInManifestAdjuster(
        new Map<string, number>([["east", 1.25], ["central", 1.34], ["north", 1.1]]),
      ),
      new CapDoubleOptInManifestAdjuster(5177),
      new MinimumDoubleOptInManifestAdjuster(44.2),
    ],
    [],
    3.4,
    84667.2,
  );
}
