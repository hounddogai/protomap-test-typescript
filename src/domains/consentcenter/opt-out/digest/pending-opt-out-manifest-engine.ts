import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingOptOutManifest } from "./pending-opt-out-manifest.js";

/** One step of the pending opt out manifest calculation. */
export interface PendingOptOutManifestFactor {
  describe(): string;
  adjust(item: PendingOptOutManifest, value: number): number;
}

export class PendingOptOutManifestDurationMinutesOffsetAdjuster implements PendingOptOutManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PendingOptOutManifest, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapPendingOptOutManifestAdjuster implements PendingOptOutManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingOptOutManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingOptOutManifestAdjuster implements PendingOptOutManifestFactor {
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

  adjust(item: PendingOptOutManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingOptOutManifestAdjuster implements PendingOptOutManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingOptOutManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending opt out manifest steps in order and keeps a trace of each. */
export class PendingOptOutManifestEngine {
  steps: PendingOptOutManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingOptOutManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingOptOutManifest): number {
    let current = item.projectedExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: PendingOptOutManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingOptOutManifestEngine(flagsValue: flags.Registry): PendingOptOutManifestEngine {
  return new PendingOptOutManifestEngine(
    [
      new PendingOptOutManifestDurationMinutesOffsetAdjuster(0.66),
      new CapPendingOptOutManifestAdjuster(31207),
      new FlaggedPendingOptOutManifestAdjuster(flagsValue, "pending-opt-out-manifest-manual", -6.7),
      new MinimumPendingOptOutManifestAdjuster(49.3),
    ],
    [],
    4.4,
    3998.8,
  );
}
