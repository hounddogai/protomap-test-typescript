import * as flags from "../../../../kit/flags.js";
import { LenientDeflectionManifest } from "./lenient-deflection-manifest.js";

/** One step of the lenient deflection manifest calculation. */
export interface LenientDeflectionManifestStep {
  describe(): string;
  adjust(item: LenientDeflectionManifest, value: number): number;
}

export class PercentLenientDeflectionManifestAdjuster implements LenientDeflectionManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientDeflectionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LenientDeflectionManifestSequenceOffsetAdjuster implements LenientDeflectionManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: LenientDeflectionManifest, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class MinimumLenientDeflectionManifestAdjuster implements LenientDeflectionManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDeflectionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientDeflectionManifestAdjuster implements LenientDeflectionManifestStep {
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

  adjust(item: LenientDeflectionManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient deflection manifest steps in order and keeps a trace of each. */
export class LenientDeflectionManifestEngine {
  steps: LenientDeflectionManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDeflectionManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientDeflectionManifest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LenientDeflectionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientDeflectionManifestEngine(flagsValue: flags.Registry): LenientDeflectionManifestEngine {
  return new LenientDeflectionManifestEngine(
    [
      new PercentLenientDeflectionManifestAdjuster(-21.2),
      new LenientDeflectionManifestSequenceOffsetAdjuster(0.26),
      new MinimumLenientDeflectionManifestAdjuster(33),
      new FlaggedLenientDeflectionManifestAdjuster(flagsValue, "lenient-deflection-manifest-rolling", 6.8),
    ],
    [],
    0.6,
    99180.2,
  );
}
