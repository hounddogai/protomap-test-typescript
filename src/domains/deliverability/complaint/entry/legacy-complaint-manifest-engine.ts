import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyComplaintManifest } from "./legacy-complaint-manifest.js";

/** One step of the legacy complaint manifest calculation. */
export interface LegacyComplaintManifestModifier {
  describe(): string;
  adjust(item: LegacyComplaintManifest, value: number): number;
}

export class RoundingLegacyComplaintManifestAdjuster implements LegacyComplaintManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyComplaintManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyComplaintManifestAdjuster implements LegacyComplaintManifestModifier {
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

  adjust(item: LegacyComplaintManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyComplaintManifestAdjuster implements LegacyComplaintManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyComplaintManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyComplaintManifestAdjuster implements LegacyComplaintManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyComplaintManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy complaint manifest steps in order and keeps a trace of each. */
export class LegacyComplaintManifestEngine {
  steps: LegacyComplaintManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyComplaintManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyComplaintManifest): number {
    let current = item.netExposure();
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

  evaluateAll(items: LegacyComplaintManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyComplaintManifestEngine(flagsValue: flags.Registry): LegacyComplaintManifestEngine {
  return new LegacyComplaintManifestEngine(
    [
      new RoundingLegacyComplaintManifestAdjuster(0.1),
      new FlaggedLegacyComplaintManifestAdjuster(flagsValue, "legacy-complaint-manifest-scheduled", 8.6),
      new CapLegacyComplaintManifestAdjuster(40932),
      new PercentLegacyComplaintManifestAdjuster(-22.7),
    ],
    [],
    4.3,
    46174,
  );
}
