import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultRetentionManifest } from "./default-retention-manifest.js";

/** One step of the default retention manifest calculation. */
export interface DefaultRetentionManifestAdjuster {
  describe(): string;
  adjust(item: DefaultRetentionManifest, value: number): number;
}

export class CapDefaultRetentionManifestAdjuster implements DefaultRetentionManifestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultRetentionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDefaultRetentionManifestAdjuster implements DefaultRetentionManifestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultRetentionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingDefaultRetentionManifestAdjuster implements DefaultRetentionManifestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultRetentionManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultRetentionManifestAdjuster implements DefaultRetentionManifestAdjuster {
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

  adjust(item: DefaultRetentionManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DefaultRetentionManifestClicksOffsetAdjuster implements DefaultRetentionManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: DefaultRetentionManifest, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the default retention manifest steps in order and keeps a trace of each. */
export class DefaultRetentionManifestEngineExtra {
  steps: DefaultRetentionManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultRetentionManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultRetentionManifest): number {
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

  evaluateAll(items: DefaultRetentionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultRetentionManifestEngine(flagsValue: flags.Registry): DefaultRetentionManifestEngineExtra {
  return new DefaultRetentionManifestEngineExtra(
    [
      new CapDefaultRetentionManifestAdjuster(14046),
      new MinimumDefaultRetentionManifestAdjuster(38.9),
      new RoundingDefaultRetentionManifestAdjuster(0.5),
      new FlaggedDefaultRetentionManifestAdjuster(flagsValue, "default-retention-manifest-tiered", -8.4),
      new DefaultRetentionManifestClicksOffsetAdjuster(0.23),
    ],
    [],
    3.8,
    54522.4,
  );
}
