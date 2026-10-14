import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackFrequencyManifest } from "./fallback-frequency-manifest.js";

/** One step of the fallback frequency manifest calculation. */
export interface FallbackFrequencyManifestModifier {
  describe(): string;
  adjust(item: FallbackFrequencyManifest, value: number): number;
}

export class RoundingFallbackFrequencyManifestAdjuster implements FallbackFrequencyManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackFrequencyManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceFallbackFrequencyManifestAdjuster implements FallbackFrequencyManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: FallbackFrequencyManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackFrequencyManifestAdjuster implements FallbackFrequencyManifestModifier {
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

  adjust(item: FallbackFrequencyManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackFrequencyManifestAdjuster implements FallbackFrequencyManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFrequencyManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackFrequencyManifestExpiresAtOffsetAdjuster implements FallbackFrequencyManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: FallbackFrequencyManifest, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the fallback frequency manifest steps in order and keeps a trace of each. */
export class FallbackFrequencyManifestEngine {
  steps: FallbackFrequencyManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFrequencyManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackFrequencyManifest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: FallbackFrequencyManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackFrequencyManifestEngine(flagsValue: flags.Registry): FallbackFrequencyManifestEngine {
  return new FallbackFrequencyManifestEngine(
    [
      new RoundingFallbackFrequencyManifestAdjuster(0.5),
      new UtmSourceFallbackFrequencyManifestAdjuster(
        new Map<string, number>([["retail", 0.93], ["south", 1.07], ["north", 1.38]]),
      ),
      new FlaggedFallbackFrequencyManifestAdjuster(flagsValue, "fallback-frequency-manifest-strict", 1.1),
      new PercentFallbackFrequencyManifestAdjuster(8.8),
      new FallbackFrequencyManifestExpiresAtOffsetAdjuster(0.48),
    ],
    [],
    1.8,
    14462.3,
  );
}
