import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

/** One step of the pending double opt in digest calculation. */
export interface PendingDoubleOptInDigestFactor {
  describe(): string;
  adjust(item: PendingDoubleOptInDigest, value: number): number;
}

export class SegmentPendingDoubleOptInDigestAdjuster implements PendingDoubleOptInDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PendingDoubleOptInDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingDoubleOptInDigestAdjuster implements PendingDoubleOptInDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingDoubleOptInDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingDoubleOptInDigestAdjuster implements PendingDoubleOptInDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingDoubleOptInDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingDoubleOptInDigestAdjuster implements PendingDoubleOptInDigestFactor {
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

  adjust(item: PendingDoubleOptInDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingDoubleOptInDigestAdjuster implements PendingDoubleOptInDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingDoubleOptInDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending double opt in digest steps in order and keeps a trace of each. */
export class PendingDoubleOptInDigestEngine {
  steps: PendingDoubleOptInDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingDoubleOptInDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingDoubleOptInDigest): number {
    let current = item.netLoad();
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

  evaluateAll(items: PendingDoubleOptInDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingDoubleOptInDigestEngine(flagsValue: flags.Registry): PendingDoubleOptInDigestEngine {
  return new PendingDoubleOptInDigestEngine(
    [
      new SegmentPendingDoubleOptInDigestAdjuster(new Map<string, number>([["south", 1.29]])),
      new PercentPendingDoubleOptInDigestAdjuster(-13.3),
      new RoundingPendingDoubleOptInDigestAdjuster(0.5),
      new FlaggedPendingDoubleOptInDigestAdjuster(flagsValue, "pending-double-opt-in-digest-scheduled", 5.9),
      new CapPendingDoubleOptInDigestAdjuster(12648),
    ],
    [],
    2.3,
    47259.4,
  );
}
