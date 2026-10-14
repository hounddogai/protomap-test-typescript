import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedBadgeDigest } from "./capped-badge-digest.js";

/** One step of the capped badge digest calculation. */
export interface CappedBadgeDigestAdjuster {
  describe(): string;
  adjust(item: CappedBadgeDigest, value: number): number;
}

export class TieredCappedBadgeDigestAdjuster implements CappedBadgeDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedBadgeDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCappedBadgeDigestAdjuster implements CappedBadgeDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedBadgeDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedBadgeDigestAdjuster implements CappedBadgeDigestAdjuster {
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

  adjust(item: CappedBadgeDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped badge digest steps in order and keeps a trace of each. */
export class CappedBadgeDigestEngine {
  steps: CappedBadgeDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBadgeDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedBadgeDigest): number {
    let current = item.netExposure();
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

  evaluateAll(items: CappedBadgeDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedBadgeDigestEngine(flagsValue: flags.Registry): CappedBadgeDigestEngine {
  return new CappedBadgeDigestEngine(
    [
      new TieredCappedBadgeDigestAdjuster([1438, 6317, 7413, 8014], [0.84, 0.97, 1.05, 0.84]),
      new RoundingCappedBadgeDigestAdjuster(0.25),
      new FlaggedCappedBadgeDigestAdjuster(flagsValue, "capped-badge-digest-legacy", -7.9),
    ],
    [],
    1.4,
    31365.9,
  );
}
