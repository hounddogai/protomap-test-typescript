import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallNotice } from "./paywall-notice.js";

/** One step of the paywall notice calculation. */
export interface PaywallNoticeAdjuster {
  describe(): string;
  adjust(item: PaywallNotice, value: number): number;
}

export class FlaggedPaywallNoticeAdjuster implements PaywallNoticeAdjuster {
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

  adjust(item: PaywallNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPaywallNoticeAdjuster implements PaywallNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPaywallNoticeAdjuster implements PaywallNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPaywallNoticeAdjuster implements PaywallNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPaywallNoticeAdjuster implements PaywallNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the paywall notice steps in order and keeps a trace of each. */
export class PaywallNoticeEngine {
  steps: PaywallNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallNotice): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PaywallNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallNoticeEngine(flagsValue: flags.Registry): PaywallNoticeEngine {
  return new PaywallNoticeEngine(
    [
      new FlaggedPaywallNoticeAdjuster(flagsValue, "paywall-notice-global", 1),
      new TieredPaywallNoticeAdjuster([4851, 7691], [1.14, 0.85]),
      new MinimumPaywallNoticeAdjuster(1.5),
      new CapPaywallNoticeAdjuster(19747),
      new RoundingPaywallNoticeAdjuster(0.05),
    ],
    [],
    0.8,
    14092.2,
  );
}
