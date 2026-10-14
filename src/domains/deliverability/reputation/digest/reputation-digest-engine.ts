import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationDigest } from "./reputation-digest.js";

/** One step of the reputation digest calculation. */
export interface ReputationDigestStep {
  describe(): string;
  adjust(item: ReputationDigest, value: number): number;
}

export class CapReputationDigestAdjuster implements ReputationDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ReputationDigestDiscountOffsetAdjuster implements ReputationDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: ReputationDigest, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedReputationDigestAdjuster implements ReputationDigestStep {
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

  adjust(item: ReputationDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingReputationDigestAdjuster implements ReputationDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredReputationDigestAdjuster implements ReputationDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentReputationDigestAdjuster implements ReputationDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation digest steps in order and keeps a trace of each. */
export class ReputationDigestEngine {
  steps: ReputationDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ReputationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationDigestEngine(flagsValue: flags.Registry): ReputationDigestEngine {
  return new ReputationDigestEngine(
    [
      new CapReputationDigestAdjuster(38717),
      new ReputationDigestDiscountOffsetAdjuster(0.71),
      new FlaggedReputationDigestAdjuster(flagsValue, "reputation-digest-weighted", -4.9),
      new RoundingReputationDigestAdjuster(5),
      new TieredReputationDigestAdjuster([5349, 6179], [1.13, 0.86]),
      new PercentReputationDigestAdjuster(19.1),
    ],
    [],
    1.1,
    2810.2,
  );
}
