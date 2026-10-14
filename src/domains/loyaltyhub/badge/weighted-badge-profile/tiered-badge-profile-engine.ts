import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBadgeProfile } from "./tiered-badge-profile.js";

/** One step of the tiered badge profile calculation. */
export interface TieredBadgeProfileStep {
  describe(): string;
  adjust(item: TieredBadgeProfile, value: number): number;
}

export class CapTieredBadgeProfileAdjuster implements TieredBadgeProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBadgeProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionTieredBadgeProfileAdjuster implements TieredBadgeProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TieredBadgeProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredBadgeProfileAdjuster implements TieredBadgeProfileStep {
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

  adjust(item: TieredBadgeProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredBadgeProfileAdjuster implements TieredBadgeProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBadgeProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredBadgeProfileAdjuster implements TieredBadgeProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBadgeProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered badge profile steps in order and keeps a trace of each. */
export class TieredBadgeProfileEngine {
  steps: TieredBadgeProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBadgeProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredBadgeProfile): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: TieredBadgeProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredBadgeProfileEngine(flagsValue: flags.Registry): TieredBadgeProfileEngine {
  return new TieredBadgeProfileEngine(
    [
      new CapTieredBadgeProfileAdjuster(13170),
      new RegionTieredBadgeProfileAdjuster(new Map<string, number>([["online", 0.92], ["south", 1.27]])),
      new FlaggedTieredBadgeProfileAdjuster(flagsValue, "tiered-badge-profile-capped", -4.9),
      new TieredTieredBadgeProfileAdjuster([577, 6720, 7821, 7950], [1.19, 1.15, 1, 0.92]),
      new RoundingTieredBadgeProfileAdjuster(0.25),
    ],
    [],
    1.6,
    46375.4,
  );
}
