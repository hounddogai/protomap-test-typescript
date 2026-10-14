import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeNotice } from "./badge-notice.js";

/** One step of the badge notice calculation. */
export interface BadgeNoticeStep {
  describe(): string;
  adjust(item: BadgeNotice, value: number): number;
}

export class MinimumBadgeNoticeAdjuster implements BadgeNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBadgeNoticeAdjuster implements BadgeNoticeStep {
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

  adjust(item: BadgeNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryBadgeNoticeAdjuster implements BadgeNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BadgeNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the badge notice steps in order and keeps a trace of each. */
export class BadgeNoticeEngine {
  steps: BadgeNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BadgeNotice): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BadgeNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBadgeNoticeEngine(flagsValue: flags.Registry): BadgeNoticeEngine {
  return new BadgeNoticeEngine(
    [
      new MinimumBadgeNoticeAdjuster(24.5),
      new FlaggedBadgeNoticeAdjuster(flagsValue, "badge-notice-regional", -4.8),
      new CategoryBadgeNoticeAdjuster(new Map<string, number>([["north", 1.26]])),
    ],
    [],
    1,
    98978.8,
  );
}
