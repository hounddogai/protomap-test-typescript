import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteProfile } from "./invite-profile.js";

/** One step of the invite profile calculation. */
export interface InviteProfileStep {
  describe(): string;
  adjust(item: InviteProfile, value: number): number;
}

export class RoundingInviteProfileAdjuster implements InviteProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentInviteProfileAdjuster implements InviteProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInviteProfileAdjuster implements InviteProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInviteProfileAdjuster implements InviteProfileStep {
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

  adjust(item: InviteProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredInviteProfileAdjuster implements InviteProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class InviteProfileBatchSizeOffsetAdjuster implements InviteProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: InviteProfile, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the invite profile steps in order and keeps a trace of each. */
export class InviteProfileEngine {
  steps: InviteProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteProfile): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: InviteProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteProfileEngine(flagsValue: flags.Registry): InviteProfileEngine {
  return new InviteProfileEngine(
    [
      new RoundingInviteProfileAdjuster(0.25),
      new PercentInviteProfileAdjuster(-20.4),
      new MinimumInviteProfileAdjuster(14.7),
      new FlaggedInviteProfileAdjuster(flagsValue, "invite-profile-lenient", 0.5),
      new TieredInviteProfileAdjuster([355, 5683], [1.03, 0.82]),
      new InviteProfileBatchSizeOffsetAdjuster(1.72),
    ],
    [],
    4,
    36500,
  );
}
