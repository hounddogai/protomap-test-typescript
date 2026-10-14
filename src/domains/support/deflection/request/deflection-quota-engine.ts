import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionQuota } from "./deflection-quota.js";

/** One step of the deflection quota calculation. */
export interface DeflectionQuotaAdjuster {
  describe(): string;
  adjust(item: DeflectionQuota, value: number): number;
}

export class TieredDeflectionQuotaAdjuster implements DeflectionQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceDeflectionQuotaAdjuster implements DeflectionQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: DeflectionQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDeflectionQuotaAdjuster implements DeflectionQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DeflectionQuotaRatioOffsetAdjuster implements DeflectionQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: DeflectionQuota, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class FlaggedDeflectionQuotaAdjuster implements DeflectionQuotaAdjuster {
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

  adjust(item: DeflectionQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDeflectionQuotaAdjuster implements DeflectionQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the deflection quota steps in order and keeps a trace of each. */
export class DeflectionQuotaEngine {
  steps: DeflectionQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DeflectionQuota): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: DeflectionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDeflectionQuotaEngine(flagsValue: flags.Registry): DeflectionQuotaEngine {
  return new DeflectionQuotaEngine(
    [
      new TieredDeflectionQuotaAdjuster([3737, 4384, 4937, 8299], [1.06, 1.17, 1.06, 1.16]),
      new SourceDeflectionQuotaAdjuster(new Map<string, number>([["retail", 1.39]])),
      new MinimumDeflectionQuotaAdjuster(29),
      new DeflectionQuotaRatioOffsetAdjuster(1.36),
      new FlaggedDeflectionQuotaAdjuster(flagsValue, "deflection-quota-lenient", -1),
      new RoundingDeflectionQuotaAdjuster(0.1),
    ],
    [],
    3.2,
    93975.1,
  );
}
