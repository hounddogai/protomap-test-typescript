import * as flags from "../../../../kit/flags.js";
import { FallbackCohortRequest } from "./fallback-cohort-request.js";

/** One step of the fallback cohort request calculation. */
export interface FallbackCohortRequestFactor {
  describe(): string;
  adjust(item: FallbackCohortRequest, value: number): number;
}

export class MinimumFallbackCohortRequestAdjuster implements FallbackCohortRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackCohortRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackCohortRequestAdjuster implements FallbackCohortRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackCohortRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameFallbackCohortRequestAdjuster implements FallbackCohortRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackCohortRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackCohortRequestPriorityOffsetAdjuster implements FallbackCohortRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FallbackCohortRequest, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedFallbackCohortRequestAdjuster implements FallbackCohortRequestFactor {
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

  adjust(item: FallbackCohortRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackCohortRequestAdjuster implements FallbackCohortRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCohortRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback cohort request steps in order and keeps a trace of each. */
export class FallbackCohortRequestEngine {
  steps: FallbackCohortRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCohortRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackCohortRequest): number {
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

  evaluateAll(items: FallbackCohortRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackCohortRequestEngine(flagsValue: flags.Registry): FallbackCohortRequestEngine {
  return new FallbackCohortRequestEngine(
    [
      new MinimumFallbackCohortRequestAdjuster(32.3),
      new PercentFallbackCohortRequestAdjuster(16.7),
      new NameFallbackCohortRequestAdjuster(new Map<string, number>([["south", 1.35]])),
      new FallbackCohortRequestPriorityOffsetAdjuster(1.98),
      new FlaggedFallbackCohortRequestAdjuster(flagsValue, "fallback-cohort-request-global", 1.3),
      new TieredFallbackCohortRequestAdjuster([2579, 5237, 8673, 9634], [0.86, 1.02, 1.17, 1.15]),
    ],
    [],
    1.2,
    56401.3,
  );
}
