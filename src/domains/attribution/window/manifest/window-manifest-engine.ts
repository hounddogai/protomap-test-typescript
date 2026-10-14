import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowManifest } from "./window-manifest.js";

/** One step of the window manifest calculation. */
export interface WindowManifestStep {
  describe(): string;
  adjust(item: WindowManifest, value: number): number;
}

export class PercentWindowManifestAdjuster implements WindowManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWindowManifestAdjuster implements WindowManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWindowManifestAdjuster implements WindowManifestStep {
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

  adjust(item: WindowManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWindowManifestAdjuster implements WindowManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleWindowManifestAdjuster implements WindowManifestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WindowManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWindowManifestAdjuster implements WindowManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the window manifest steps in order and keeps a trace of each. */
export class WindowManifestEngine {
  steps: WindowManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowManifest): number {
    let current = item.projectedValue();
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

  evaluateAll(items: WindowManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowManifestEngine(flagsValue: flags.Registry): WindowManifestEngine {
  return new WindowManifestEngine(
    [
      new PercentWindowManifestAdjuster(-6.4),
      new RoundingWindowManifestAdjuster(5),
      new FlaggedWindowManifestAdjuster(flagsValue, "window-manifest-primary", 9.7),
      new TieredWindowManifestAdjuster([3405, 8409], [1.19, 1.04]),
      new LocaleWindowManifestAdjuster(new Map<string, number>([["north", 1.37], ["retail", 1.26]])),
      new MinimumWindowManifestAdjuster(48.6),
    ],
    [],
    2.5,
    58328.7,
  );
}
