import * as flags from "../../../../kit/flags.js";
import { LegacyFraudCheckDigest } from "./legacy-fraud-check-digest.js";

/** One step of the legacy fraud check digest calculation. */
export interface LegacyFraudCheckDigestFactor {
  describe(): string;
  adjust(item: LegacyFraudCheckDigest, value: number): number;
}

export class LegacyFraudCheckDigestBudgetOffsetAdjuster implements LegacyFraudCheckDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LegacyFraudCheckDigest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentLegacyFraudCheckDigestAdjuster implements LegacyFraudCheckDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyFraudCheckDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyFraudCheckDigestAdjuster implements LegacyFraudCheckDigestFactor {
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

  adjust(item: LegacyFraudCheckDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyFraudCheckDigestAdjuster implements LegacyFraudCheckDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFraudCheckDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameLegacyFraudCheckDigestAdjuster implements LegacyFraudCheckDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LegacyFraudCheckDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLegacyFraudCheckDigestAdjuster implements LegacyFraudCheckDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFraudCheckDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy fraud check digest steps in order and keeps a trace of each. */
export class LegacyFraudCheckDigestEngine {
  steps: LegacyFraudCheckDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFraudCheckDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyFraudCheckDigest): number {
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

  evaluateAll(items: LegacyFraudCheckDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyFraudCheckDigestEngine(flagsValue: flags.Registry): LegacyFraudCheckDigestEngine {
  return new LegacyFraudCheckDigestEngine(
    [
      new LegacyFraudCheckDigestBudgetOffsetAdjuster(0.98),
      new PercentLegacyFraudCheckDigestAdjuster(9.2),
      new FlaggedLegacyFraudCheckDigestAdjuster(flagsValue, "legacy-fraud-check-digest-rolling", -8.9),
      new CapLegacyFraudCheckDigestAdjuster(21221),
      new NameLegacyFraudCheckDigestAdjuster(
        new Map<string, number>([["retail", 0.95], ["north", 1], ["central", 1.03]]),
      ),
      new TieredLegacyFraudCheckDigestAdjuster([2829, 6430, 8223], [1.19, 1.06, 1.17]),
    ],
    [],
    2.7,
    10844.6,
  );
}
