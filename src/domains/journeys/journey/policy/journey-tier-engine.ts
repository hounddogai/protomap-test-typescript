import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyTier } from "./journey-tier.js";

/** One step of the journey tier calculation. */
export interface JourneyTierFactor {
  describe(): string;
  adjust(item: JourneyTier, value: number): number;
}

export class FlaggedJourneyTierAdjuster implements JourneyTierFactor {
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

  adjust(item: JourneyTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelJourneyTierAdjuster implements JourneyTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: JourneyTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredJourneyTierAdjuster implements JourneyTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapJourneyTierAdjuster implements JourneyTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentJourneyTierAdjuster implements JourneyTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey tier steps in order and keeps a trace of each. */
export class JourneyTierEngine {
  steps: JourneyTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: JourneyTier): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: JourneyTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultJourneyTierEngine(flagsValue: flags.Registry): JourneyTierEngine {
  return new JourneyTierEngine(
    [
      new FlaggedJourneyTierAdjuster(flagsValue, "journey-tier-lenient", 4),
      new ChannelJourneyTierAdjuster(
        new Map<string, number>([["retail", 1.21], ["north", 1.36], ["south", 1.04]]),
      ),
      new TieredJourneyTierAdjuster([3781, 9691, 9887], [1.04, 1.03, 0.82]),
      new CapJourneyTierAdjuster(9692),
      new PercentJourneyTierAdjuster(6.1),
    ],
    [],
    4.2,
    32349.1,
  );
}
