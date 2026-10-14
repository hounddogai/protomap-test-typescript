import * as flags from "../../../../kit/flags.js";
import { FunnelManifest } from "./funnel-manifest.js";

/** One step of the funnel manifest calculation. */
export interface FunnelManifestAdjuster {
  describe(): string;
  adjust(item: FunnelManifest, value: number): number;
}

export class MinimumFunnelManifestAdjuster implements FunnelManifestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionFunnelManifestAdjuster implements FunnelManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: FunnelManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFunnelManifestAdjuster implements FunnelManifestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFunnelManifestAdjuster implements FunnelManifestAdjuster {
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

  adjust(item: FunnelManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel manifest steps in order and keeps a trace of each. */
export class FunnelManifestEngine {
  steps: FunnelManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelManifest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: FunnelManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelManifestEngine(flagsValue: flags.Registry): FunnelManifestEngine {
  return new FunnelManifestEngine(
    [
      new MinimumFunnelManifestAdjuster(36.8),
      new RegionFunnelManifestAdjuster(
        new Map<string, number>([["online", 0.92], ["south", 1.22], ["north", 0.81]]),
      ),
      new PercentFunnelManifestAdjuster(20.3),
      new FlaggedFunnelManifestAdjuster(flagsValue, "funnel-manifest-global", -8),
    ],
    [],
    4,
    27800,
  );
}
