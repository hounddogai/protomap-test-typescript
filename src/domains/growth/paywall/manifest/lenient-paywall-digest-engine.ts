import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPaywallDigest } from "./lenient-paywall-digest.js";

/** One step of the lenient paywall digest calculation. */
export interface LenientPaywallDigestFactor {
  describe(): string;
  adjust(item: LenientPaywallDigest, value: number): number;
}

export class RoundingLenientPaywallDigestAdjuster implements LenientPaywallDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPaywallDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientPaywallDigestAdjuster implements LenientPaywallDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPaywallDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientPaywallDigestAdjuster implements LenientPaywallDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPaywallDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientPaywallDigestAdjuster implements LenientPaywallDigestFactor {
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

  adjust(item: LenientPaywallDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelLenientPaywallDigestAdjuster implements LenientPaywallDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientPaywallDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientPaywallDigestAdjuster implements LenientPaywallDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPaywallDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient paywall digest steps in order and keeps a trace of each. */
export class LenientPaywallDigestEngine {
  steps: LenientPaywallDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPaywallDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientPaywallDigest): number {
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

  evaluateAll(items: LenientPaywallDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientPaywallDigestEngine(flagsValue: flags.Registry): LenientPaywallDigestEngine {
  return new LenientPaywallDigestEngine(
    [
      new RoundingLenientPaywallDigestAdjuster(0.25),
      new MinimumLenientPaywallDigestAdjuster(34),
      new TieredLenientPaywallDigestAdjuster([4598, 9667], [1.09, 1.16]),
      new FlaggedLenientPaywallDigestAdjuster(flagsValue, "lenient-paywall-digest-rolling", 3.7),
      new ChannelLenientPaywallDigestAdjuster(new Map<string, number>([["central", 1.03], ["north", 1.23]])),
      new PercentLenientPaywallDigestAdjuster(17.4),
    ],
    [],
    2.4,
    79953.6,
  );
}
