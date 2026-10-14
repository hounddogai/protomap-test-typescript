import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPostDigest } from "./pending-post-digest.js";

/** One step of the pending post digest calculation. */
export interface PendingPostDigestFactor {
  describe(): string;
  adjust(item: PendingPostDigest, value: number): number;
}

export class CapPendingPostDigestAdjuster implements PendingPostDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPostDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingPostDigestAdjuster implements PendingPostDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingPostDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourcePendingPostDigestAdjuster implements PendingPostDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PendingPostDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingPostDigestDurationMinutesOffsetAdjuster implements PendingPostDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PendingPostDigest, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class PercentPendingPostDigestAdjuster implements PendingPostDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPostDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingPostDigestAdjuster implements PendingPostDigestFactor {
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

  adjust(item: PendingPostDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending post digest steps in order and keeps a trace of each. */
export class PendingPostDigestEngine {
  steps: PendingPostDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPostDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingPostDigest): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PendingPostDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingPostDigestEngine(flagsValue: flags.Registry): PendingPostDigestEngine {
  return new PendingPostDigestEngine(
    [
      new CapPendingPostDigestAdjuster(11986),
      new TieredPendingPostDigestAdjuster([2874, 6191, 9110], [0.98, 0.93, 0.85]),
      new SourcePendingPostDigestAdjuster(
        new Map<string, number>([["east", 0.82], ["south", 1.07], ["online", 0.81]]),
      ),
      new PendingPostDigestDurationMinutesOffsetAdjuster(0.32),
      new PercentPendingPostDigestAdjuster(9.6),
      new FlaggedPendingPostDigestAdjuster(flagsValue, "pending-post-digest-global", 3.4),
    ],
    [],
    0.6,
    56579.8,
  );
}
