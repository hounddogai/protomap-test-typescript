import * as flags from "../../../../kit/flags.js";
import { MacroManifest } from "./macro-manifest.js";

/** One step of the macro manifest calculation. */
export interface MacroManifestAdjuster {
  describe(): string;
  adjust(item: MacroManifest, value: number): number;
}

export class FlaggedMacroManifestAdjuster implements MacroManifestAdjuster {
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

  adjust(item: MacroManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredMacroManifestAdjuster implements MacroManifestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMacroManifestAdjuster implements MacroManifestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MacroManifestGraceDaysOffsetAdjuster implements MacroManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: MacroManifest, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentMacroManifestAdjuster implements MacroManifestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceMacroManifestAdjuster implements MacroManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: MacroManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the macro manifest steps in order and keeps a trace of each. */
export class MacroManifestEngine {
  steps: MacroManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroManifest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: MacroManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroManifestEngine(flagsValue: flags.Registry): MacroManifestEngine {
  return new MacroManifestEngine(
    [
      new FlaggedMacroManifestAdjuster(flagsValue, "macro-manifest-regional", 8.8),
      new TieredMacroManifestAdjuster([1788, 2136], [0.84, 0.97]),
      new MinimumMacroManifestAdjuster(10.5),
      new MacroManifestGraceDaysOffsetAdjuster(0.17),
      new PercentMacroManifestAdjuster(14.6),
      new SourceMacroManifestAdjuster(new Map<string, number>([["south", 0.95], ["retail", 0.86]])),
    ],
    [],
    4.9,
    20069.1,
  );
}
