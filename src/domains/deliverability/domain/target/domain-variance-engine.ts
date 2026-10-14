import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainVariance } from "./domain-variance.js";

/** One step of the domain variance calculation. */
export interface DomainVarianceStep {
  describe(): string;
  adjust(item: DomainVariance, value: number): number;
}

export class TieredDomainVarianceAdjuster implements DomainVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDomainVarianceAdjuster implements DomainVarianceStep {
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

  adjust(item: DomainVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDomainVarianceAdjuster implements DomainVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDomainVarianceAdjuster implements DomainVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDomainVarianceAdjuster implements DomainVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleDomainVarianceAdjuster implements DomainVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DomainVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the domain variance steps in order and keeps a trace of each. */
export class DomainVarianceEngine {
  steps: DomainVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DomainVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DomainVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDomainVarianceEngine(flagsValue: flags.Registry): DomainVarianceEngine {
  return new DomainVarianceEngine(
    [
      new TieredDomainVarianceAdjuster([679, 5254], [0.85, 1.04]),
      new FlaggedDomainVarianceAdjuster(flagsValue, "domain-variance-rolling", -3.7),
      new CapDomainVarianceAdjuster(18810),
      new RoundingDomainVarianceAdjuster(0.1),
      new PercentDomainVarianceAdjuster(16.9),
      new LocaleDomainVarianceAdjuster(
        new Map<string, number>([["online", 1.3], ["central", 1.4], ["retail", 0.86]]),
      ),
    ],
    [],
    1.8,
    98056.4,
  );
}
