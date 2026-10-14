import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultCreditDigest } from "./default-credit-digest.js";

/** One step of the default credit digest calculation. */
export interface DefaultCreditDigestStep {
  describe(): string;
  adjust(item: DefaultCreditDigest, value: number): number;
}

export class TieredDefaultCreditDigestAdjuster implements DefaultCreditDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultCreditDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DefaultCreditDigestBatchSizeOffsetAdjuster implements DefaultCreditDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: DefaultCreditDigest, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class FlaggedDefaultCreditDigestAdjuster implements DefaultCreditDigestStep {
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

  adjust(item: DefaultCreditDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultCreditDigestAdjuster implements DefaultCreditDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultCreditDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDefaultCreditDigestAdjuster implements DefaultCreditDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultCreditDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default credit digest steps in order and keeps a trace of each. */
export class DefaultCreditDigestEngine {
  steps: DefaultCreditDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCreditDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultCreditDigest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultCreditDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultCreditDigestEngine(flagsValue: flags.Registry): DefaultCreditDigestEngine {
  return new DefaultCreditDigestEngine(
    [
      new TieredDefaultCreditDigestAdjuster([892, 7905, 9386], [0.88, 1.13, 0.96]),
      new DefaultCreditDigestBatchSizeOffsetAdjuster(1.4),
      new FlaggedDefaultCreditDigestAdjuster(flagsValue, "default-credit-digest-scheduled", 5),
      new RoundingDefaultCreditDigestAdjuster(5),
      new MinimumDefaultCreditDigestAdjuster(14.1),
    ],
    [],
    4.1,
    12159.1,
  );
}
