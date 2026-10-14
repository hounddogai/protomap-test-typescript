import * as flags from "../../../../kit/flags.js";
import { RegionalCreditRequest } from "./regional-credit-request.js";

/** One step of the regional credit request calculation. */
export interface RegionalCreditRequestModifier {
  describe(): string;
  adjust(item: RegionalCreditRequest, value: number): number;
}

export class LocaleRegionalCreditRequestAdjuster implements RegionalCreditRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalCreditRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalCreditRequestAdjuster implements RegionalCreditRequestModifier {
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

  adjust(item: RegionalCreditRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalCreditRequestAdjuster implements RegionalCreditRequestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalCreditRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalCreditRequestAdjuster implements RegionalCreditRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalCreditRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional credit request steps in order and keeps a trace of each. */
export class RegionalCreditRequestEngine {
  steps: RegionalCreditRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCreditRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalCreditRequest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RegionalCreditRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalCreditRequestEngine(flagsValue: flags.Registry): RegionalCreditRequestEngine {
  return new RegionalCreditRequestEngine(
    [
      new LocaleRegionalCreditRequestAdjuster(new Map<string, number>([["online", 0.83]])),
      new FlaggedRegionalCreditRequestAdjuster(flagsValue, "regional-credit-request-capped", 9),
      new TieredRegionalCreditRequestAdjuster([3407, 5769], [1.16, 0.85]),
      new MinimumRegionalCreditRequestAdjuster(25.3),
    ],
    [],
    3.5,
    1416.2,
  );
}
