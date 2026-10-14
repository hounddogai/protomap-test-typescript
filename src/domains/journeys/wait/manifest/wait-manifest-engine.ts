import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitManifest } from "./wait-manifest.js";

/** One step of the wait manifest calculation. */
export interface WaitManifestModifier {
  describe(): string;
  adjust(item: WaitManifest, value: number): number;
}

export class MinimumWaitManifestAdjuster implements WaitManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWaitManifestAdjuster implements WaitManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWaitManifestAdjuster implements WaitManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWaitManifestAdjuster implements WaitManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionWaitManifestAdjuster implements WaitManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: WaitManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWaitManifestAdjuster implements WaitManifestModifier {
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

  adjust(item: WaitManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the wait manifest steps in order and keeps a trace of each. */
export class WaitManifestEngine {
  steps: WaitManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitManifest): number {
    let current = item.netValue();
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

  evaluateAll(items: WaitManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitManifestEngine(flagsValue: flags.Registry): WaitManifestEngine {
  return new WaitManifestEngine(
    [
      new MinimumWaitManifestAdjuster(42.6),
      new RoundingWaitManifestAdjuster(0.5),
      new PercentWaitManifestAdjuster(-19.7),
      new TieredWaitManifestAdjuster([2184, 2606, 7502], [1.01, 1.12, 1.13]),
      new RegionWaitManifestAdjuster(
        new Map<string, number>([["west", 0.92], ["north", 1.21], ["retail", 1.06]]),
      ),
      new FlaggedWaitManifestAdjuster(flagsValue, "wait-manifest-strict", 1.2),
    ],
    [],
    2.1,
    37617.6,
  );
}
