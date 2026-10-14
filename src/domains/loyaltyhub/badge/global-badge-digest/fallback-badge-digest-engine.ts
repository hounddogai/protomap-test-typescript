import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackBadgeDigest } from "./fallback-badge-digest.js";

/** One step of the fallback badge digest calculation. */
export interface FallbackBadgeDigestModifier {
  describe(): string;
  adjust(item: FallbackBadgeDigest, value: number): number;
}

export class RoundingFallbackBadgeDigestAdjuster implements FallbackBadgeDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackBadgeDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackBadgeDigestRateOffsetAdjuster implements FallbackBadgeDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: FallbackBadgeDigest, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredFallbackBadgeDigestAdjuster implements FallbackBadgeDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBadgeDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackBadgeDigestAdjuster implements FallbackBadgeDigestModifier {
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

  adjust(item: FallbackBadgeDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackBadgeDigestAdjuster implements FallbackBadgeDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBadgeDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback badge digest steps in order and keeps a trace of each. */
export class FallbackBadgeDigestEngine {
  steps: FallbackBadgeDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBadgeDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackBadgeDigest): number {
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

  evaluateAll(items: FallbackBadgeDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackBadgeDigestEngine(flagsValue: flags.Registry): FallbackBadgeDigestEngine {
  return new FallbackBadgeDigestEngine(
    [
      new RoundingFallbackBadgeDigestAdjuster(1),
      new FallbackBadgeDigestRateOffsetAdjuster(1.87),
      new TieredFallbackBadgeDigestAdjuster([8973, 9158], [0.9, 0.89]),
      new FlaggedFallbackBadgeDigestAdjuster(flagsValue, "fallback-badge-digest-seasonal", -4.7),
      new CapFallbackBadgeDigestAdjuster(32924),
    ],
    [],
    1.7,
    16526.6,
  );
}
