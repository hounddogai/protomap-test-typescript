import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeDigest } from "./badge-digest.js";

/** One step of the badge digest calculation. */
export interface BadgeDigestFactor {
  describe(): string;
  adjust(item: BadgeDigest, value: number): number;
}

export class RoundingBadgeDigestAdjuster implements BadgeDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBadgeDigestAdjuster implements BadgeDigestFactor {
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

  adjust(item: BadgeDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBadgeDigestAdjuster implements BadgeDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBadgeDigestAdjuster implements BadgeDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBadgeDigestAdjuster implements BadgeDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBadgeDigestAdjuster implements BadgeDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the badge digest steps in order and keeps a trace of each. */
export class BadgeDigestEngine {
  steps: BadgeDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeDigest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: BadgeDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeDigestEngine(flagsValue: flags.Registry): BadgeDigestEngine {
  return new BadgeDigestEngine(
    [
      new RoundingBadgeDigestAdjuster(1),
      new FlaggedBadgeDigestAdjuster(flagsValue, "badge-digest-seasonal", -3),
      new TieredBadgeDigestAdjuster([5239, 6655], [1.15, 1.05]),
      new PercentBadgeDigestAdjuster(-3.6),
      new MinimumBadgeDigestAdjuster(12.6),
      new CapBadgeDigestAdjuster(22007),
    ],
    [],
    3.3,
    66767.5,
  );
}
