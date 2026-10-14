import * as flags from "../../../../kit/flags.js";
import { RegionalBounceNotice } from "./regional-bounce-notice.js";

/** One step of the regional bounce notice calculation. */
export interface RegionalBounceNoticeStep {
  describe(): string;
  adjust(item: RegionalBounceNotice, value: number): number;
}

export class FlaggedRegionalBounceNoticeAdjuster implements RegionalBounceNoticeStep {
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

  adjust(item: RegionalBounceNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalBounceNoticeAdjuster implements RegionalBounceNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalBounceNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalBounceNoticeAdjuster implements RegionalBounceNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalBounceNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitRegionalBounceNoticeAdjuster implements RegionalBounceNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RegionalBounceNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalBounceNoticeAdjuster implements RegionalBounceNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalBounceNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional bounce notice steps in order and keeps a trace of each. */
export class RegionalBounceNoticeEngine {
  steps: RegionalBounceNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalBounceNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalBounceNotice): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RegionalBounceNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalBounceNoticeEngine(flagsValue: flags.Registry): RegionalBounceNoticeEngine {
  return new RegionalBounceNoticeEngine(
    [
      new FlaggedRegionalBounceNoticeAdjuster(flagsValue, "regional-bounce-notice-default", 4.4),
      new MinimumRegionalBounceNoticeAdjuster(9),
      new TieredRegionalBounceNoticeAdjuster([269, 5433], [1.14, 0.98]),
      new UnitRegionalBounceNoticeAdjuster(
        new Map<string, number>([["south", 1.01], ["west", 1.09], ["online", 1.01]]),
      ),
      new PercentRegionalBounceNoticeAdjuster(4.2),
    ],
    [],
    0.2,
    54705.5,
  );
}
