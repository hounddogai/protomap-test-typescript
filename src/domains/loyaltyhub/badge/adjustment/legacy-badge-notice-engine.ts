import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyBadgeNotice } from "./legacy-badge-notice.js";

/** One step of the legacy badge notice calculation. */
export interface LegacyBadgeNoticeFactor {
  describe(): string;
  adjust(item: LegacyBadgeNotice, value: number): number;
}

export class LabelLegacyBadgeNoticeAdjuster implements LegacyBadgeNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyBadgeNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyBadgeNoticeAdjuster implements LegacyBadgeNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyBadgeNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacyBadgeNoticeAdjuster implements LegacyBadgeNoticeFactor {
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

  adjust(item: LegacyBadgeNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy badge notice steps in order and keeps a trace of each. */
export class LegacyBadgeNoticeEngine {
  steps: LegacyBadgeNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBadgeNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyBadgeNotice): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LegacyBadgeNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyBadgeNoticeEngine(flagsValue: flags.Registry): LegacyBadgeNoticeEngine {
  return new LegacyBadgeNoticeEngine(
    [
      new LabelLegacyBadgeNoticeAdjuster(
        new Map<string, number>([["south", 1.1], ["east", 0.8], ["west", 1.26]]),
      ),
      new CapLegacyBadgeNoticeAdjuster(38598),
      new FlaggedLegacyBadgeNoticeAdjuster(flagsValue, "legacy-badge-notice-weighted", -9.6),
    ],
    [],
    4.7,
    40494.7,
  );
}
