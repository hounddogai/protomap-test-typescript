import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainEstimate } from "./domain-estimate.js";

/** One step of the domain estimate calculation. */
export interface DomainEstimateStep {
  describe(): string;
  adjust(item: DomainEstimate, value: number): number;
}

export class CapDomainEstimateAdjuster implements DomainEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDomainEstimateAdjuster implements DomainEstimateStep {
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

  adjust(item: DomainEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DomainEstimateRevisionOffsetAdjuster implements DomainEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: DomainEstimate, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class TieredDomainEstimateAdjuster implements DomainEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDomainEstimateAdjuster implements DomainEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDomainEstimateAdjuster implements DomainEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the domain estimate steps in order and keeps a trace of each. */
export class DomainEstimateEngine {
  steps: DomainEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainEstimate): number {
    let current = item.netExposure();
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

  evaluateAll(items: DomainEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainEstimateEngine(flagsValue: flags.Registry): DomainEstimateEngine {
  return new DomainEstimateEngine(
    [
      new CapDomainEstimateAdjuster(8956),
      new FlaggedDomainEstimateAdjuster(flagsValue, "domain-estimate-legacy", 5.6),
      new DomainEstimateRevisionOffsetAdjuster(1.87),
      new TieredDomainEstimateAdjuster([1783, 6224], [1.13, 0.93]),
      new RoundingDomainEstimateAdjuster(0.5),
      new MinimumDomainEstimateAdjuster(26.5),
    ],
    [],
    0.4,
    74596.7,
  );
}
