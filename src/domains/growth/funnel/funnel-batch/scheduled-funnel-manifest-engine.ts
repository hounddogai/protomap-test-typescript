import * as flags from "../../../../kit/flags.js";
import { ScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

/** One step of the scheduled funnel manifest calculation. */
export interface ScheduledFunnelManifestFactor {
  describe(): string;
  adjust(item: ScheduledFunnelManifest, value: number): number;
}

export class FlaggedScheduledFunnelManifestAdjuster implements ScheduledFunnelManifestFactor {
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

  adjust(item: ScheduledFunnelManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledFunnelManifestAdjuster implements ScheduledFunnelManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFunnelManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameScheduledFunnelManifestAdjuster implements ScheduledFunnelManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledFunnelManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled funnel manifest steps in order and keeps a trace of each. */
export class ScheduledFunnelManifestEngine {
  steps: ScheduledFunnelManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFunnelManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledFunnelManifest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ScheduledFunnelManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledFunnelManifestEngine(flagsValue: flags.Registry): ScheduledFunnelManifestEngine {
  return new ScheduledFunnelManifestEngine(
    [
      new FlaggedScheduledFunnelManifestAdjuster(flagsValue, "scheduled-funnel-manifest-batched", -1.8),
      new CapScheduledFunnelManifestAdjuster(24208),
      new NameScheduledFunnelManifestAdjuster(new Map<string, number>([["retail", 0.92], ["west", 0.75]])),
    ],
    [],
    1.5,
    18960.1,
  );
}
