import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionDigest } from "./deflection-digest.js";

/** One step of the deflection digest calculation. */
export interface DeflectionDigestAdjuster {
  describe(): string;
  adjust(item: DeflectionDigest, value: number): number;
}

export class CapDeflectionDigestAdjuster implements DeflectionDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDeflectionDigestAdjuster implements DeflectionDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDeflectionDigestAdjuster implements DeflectionDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDeflectionDigestAdjuster implements DeflectionDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceDeflectionDigestAdjuster implements DeflectionDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DeflectionDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDeflectionDigestAdjuster implements DeflectionDigestAdjuster {
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

  adjust(item: DeflectionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the deflection digest steps in order and keeps a trace of each. */
export class DeflectionDigestEngine {
  steps: DeflectionDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DeflectionDigest): number {
    let current = item.weightedValue();
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

  evaluateAll(items: DeflectionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDeflectionDigestEngine(flagsValue: flags.Registry): DeflectionDigestEngine {
  return new DeflectionDigestEngine(
    [
      new CapDeflectionDigestAdjuster(13070),
      new TieredDeflectionDigestAdjuster([38, 1462, 3264], [1.13, 0.82, 0.86]),
      new RoundingDeflectionDigestAdjuster(0.1),
      new PercentDeflectionDigestAdjuster(-1.5),
      new UtmSourceDeflectionDigestAdjuster(new Map<string, number>([["south", 1.36]])),
      new FlaggedDeflectionDigestAdjuster(flagsValue, "deflection-digest-strict", -7),
    ],
    [],
    4.4,
    51232.5,
  );
}
