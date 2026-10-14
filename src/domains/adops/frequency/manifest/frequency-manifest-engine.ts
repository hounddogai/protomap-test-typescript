import * as flags from "../../../../kit/flags.js";
import { FrequencyManifest } from "./frequency-manifest.js";

/** One step of the frequency manifest calculation. */
export interface FrequencyManifestStep {
  describe(): string;
  adjust(item: FrequencyManifest, value: number): number;
}

export class UtmSourceFrequencyManifestAdjuster implements FrequencyManifestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: FrequencyManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FrequencyManifestQuantityOffsetAdjuster implements FrequencyManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: FrequencyManifest, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedFrequencyManifestAdjuster implements FrequencyManifestStep {
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

  adjust(item: FrequencyManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the frequency manifest steps in order and keeps a trace of each. */
export class FrequencyManifestEngine {
  steps: FrequencyManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FrequencyManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyManifestEngine(flagsValue: flags.Registry): FrequencyManifestEngine {
  return new FrequencyManifestEngine(
    [
      new UtmSourceFrequencyManifestAdjuster(new Map<string, number>([["east", 0.98], ["south", 1.12]])),
      new FrequencyManifestQuantityOffsetAdjuster(1.93),
      new FlaggedFrequencyManifestAdjuster(flagsValue, "frequency-manifest-capped", 7.8),
    ],
    [],
    0.6,
    20127.4,
  );
}
