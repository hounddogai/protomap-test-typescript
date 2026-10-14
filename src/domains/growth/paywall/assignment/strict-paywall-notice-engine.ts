import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictPaywallNotice } from "./strict-paywall-notice.js";

/** One step of the strict paywall notice calculation. */
export interface StrictPaywallNoticeStep {
  describe(): string;
  adjust(item: StrictPaywallNotice, value: number): number;
}

export class FlaggedStrictPaywallNoticeAdjuster implements StrictPaywallNoticeStep {
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

  adjust(item: StrictPaywallNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictPaywallNoticeAdjuster implements StrictPaywallNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPaywallNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictPaywallNoticeAdjuster implements StrictPaywallNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPaywallNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict paywall notice steps in order and keeps a trace of each. */
export class StrictPaywallNoticeEngine {
  steps: StrictPaywallNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPaywallNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictPaywallNotice): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StrictPaywallNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictPaywallNoticeEngine(flagsValue: flags.Registry): StrictPaywallNoticeEngine {
  return new StrictPaywallNoticeEngine(
    [
      new FlaggedStrictPaywallNoticeAdjuster(flagsValue, "strict-paywall-notice-scheduled", -8.8),
      new TieredStrictPaywallNoticeAdjuster([769, 2858], [0.93, 1.11]),
      new CapStrictPaywallNoticeAdjuster(34601),
    ],
    [],
    2.8,
    38780.8,
  );
}
