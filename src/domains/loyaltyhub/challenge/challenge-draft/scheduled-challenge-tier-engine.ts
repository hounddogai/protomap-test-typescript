import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledChallengeTier } from "./scheduled-challenge-tier.js";

/** One step of the scheduled challenge tier calculation. */
export interface ScheduledChallengeTierFactor {
  describe(): string;
  adjust(item: ScheduledChallengeTier, value: number): number;
}

export class ScheduledChallengeTierVersionOffsetAdjuster implements ScheduledChallengeTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ScheduledChallengeTier, value: number): number {
    return value + item.version * this.weight;
  }
}

export class FlaggedScheduledChallengeTierAdjuster implements ScheduledChallengeTierFactor {
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

  adjust(item: ScheduledChallengeTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledChallengeTierAdjuster implements ScheduledChallengeTierFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledChallengeTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledChallengeTierAdjuster implements ScheduledChallengeTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledChallengeTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledChallengeTierAdjuster implements ScheduledChallengeTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledChallengeTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled challenge tier steps in order and keeps a trace of each. */
export class ScheduledChallengeTierEngine {
  steps: ScheduledChallengeTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledChallengeTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledChallengeTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: ScheduledChallengeTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledChallengeTierEngine(flagsValue: flags.Registry): ScheduledChallengeTierEngine {
  return new ScheduledChallengeTierEngine(
    [
      new ScheduledChallengeTierVersionOffsetAdjuster(0.53),
      new FlaggedScheduledChallengeTierAdjuster(flagsValue, "scheduled-challenge-tier-adaptive", -6.6),
      new RoundingScheduledChallengeTierAdjuster(5),
      new CapScheduledChallengeTierAdjuster(12968),
      new TieredScheduledChallengeTierAdjuster([5130, 7599], [1.18, 0.96]),
    ],
    [],
    4.3,
    54828,
  );
}
