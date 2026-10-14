import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteDigest } from "./invite-digest.js";

/** One step of the invite digest calculation. */
export interface InviteDigestFactor {
  describe(): string;
  adjust(item: InviteDigest, value: number): number;
}

export class TitleInviteDigestAdjuster implements InviteDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: InviteDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumInviteDigestAdjuster implements InviteDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInviteDigestAdjuster implements InviteDigestFactor {
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

  adjust(item: InviteDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredInviteDigestAdjuster implements InviteDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentInviteDigestAdjuster implements InviteDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class InviteDigestCapacityOffsetAdjuster implements InviteDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: InviteDigest, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the invite digest steps in order and keeps a trace of each. */
export class InviteDigestEngine {
  steps: InviteDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteDigest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: InviteDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteDigestEngine(flagsValue: flags.Registry): InviteDigestEngine {
  return new InviteDigestEngine(
    [
      new TitleInviteDigestAdjuster(new Map<string, number>([["online", 1.27], ["retail", 1.08]])),
      new MinimumInviteDigestAdjuster(8.3),
      new FlaggedInviteDigestAdjuster(flagsValue, "invite-digest-adaptive", -6.9),
      new TieredInviteDigestAdjuster([3971, 6523, 7981, 9903], [0.98, 1.17, 1.13, 0.83]),
      new PercentInviteDigestAdjuster(-15.6),
      new InviteDigestCapacityOffsetAdjuster(0.69),
    ],
    [],
    4.2,
    74631.2,
  );
}
