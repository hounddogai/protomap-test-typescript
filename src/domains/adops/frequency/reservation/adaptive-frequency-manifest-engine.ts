import * as flags from "../../../../kit/flags.js";
import { AdaptiveFrequencyManifest } from "./adaptive-frequency-manifest.js";

/** One step of the adaptive frequency manifest calculation. */
export interface AdaptiveFrequencyManifestModifier {
  describe(): string;
  adjust(item: AdaptiveFrequencyManifest, value: number): number;
}

export class FlaggedAdaptiveFrequencyManifestAdjuster implements AdaptiveFrequencyManifestModifier {
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

  adjust(item: AdaptiveFrequencyManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveFrequencyManifestAdjuster implements AdaptiveFrequencyManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveFrequencyManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelAdaptiveFrequencyManifestAdjuster implements AdaptiveFrequencyManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveFrequencyManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive frequency manifest steps in order and keeps a trace of each. */
export class AdaptiveFrequencyManifestEngine {
  steps: AdaptiveFrequencyManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFrequencyManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveFrequencyManifest): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: AdaptiveFrequencyManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveFrequencyManifestEngine(flagsValue: flags.Registry): AdaptiveFrequencyManifestEngine {
  return new AdaptiveFrequencyManifestEngine(
    [
      new FlaggedAdaptiveFrequencyManifestAdjuster(flagsValue, "adaptive-frequency-manifest-legacy", -8.9),
      new PercentAdaptiveFrequencyManifestAdjuster(-22.6),
      new LabelAdaptiveFrequencyManifestAdjuster(
        new Map<string, number>([["retail", 1.23], ["central", 1.08], ["south", 1.05]]),
      ),
    ],
    [],
    2.7,
    31685.4,
  );
}
