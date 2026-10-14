import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionAgreement } from "./retention-agreement.js";

/** One step of the retention agreement calculation. */
export interface RetentionAgreementFactor {
  describe(): string;
  adjust(item: RetentionAgreement, value: number): number;
}

export class RetentionAgreementRateOffsetAdjuster implements RetentionAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RetentionAgreement, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class UnitRetentionAgreementAdjuster implements RetentionAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RetentionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRetentionAgreementAdjuster implements RetentionAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRetentionAgreementAdjuster implements RetentionAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRetentionAgreementAdjuster implements RetentionAgreementFactor {
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

  adjust(item: RetentionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRetentionAgreementAdjuster implements RetentionAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the retention agreement steps in order and keeps a trace of each. */
export class RetentionAgreementEngine {
  steps: RetentionAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RetentionAgreement): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RetentionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRetentionAgreementEngine(flagsValue: flags.Registry): RetentionAgreementEngine {
  return new RetentionAgreementEngine(
    [
      new RetentionAgreementRateOffsetAdjuster(0.07),
      new UnitRetentionAgreementAdjuster(new Map<string, number>([["east", 1.08]])),
      new PercentRetentionAgreementAdjuster(-9.7),
      new TieredRetentionAgreementAdjuster([4248, 4448, 6233, 6417], [1.19, 0.81, 0.83, 1.19]),
      new FlaggedRetentionAgreementAdjuster(flagsValue, "retention-agreement-manual", 3.3),
      new CapRetentionAgreementAdjuster(42352),
    ],
    [],
    0.6,
    7240.4,
  );
}
