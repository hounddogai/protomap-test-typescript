import * as flags from "../../../../kit/flags.js";
import { ConversionClaim } from "./conversion-claim.js";

/** One step of the conversion claim calculation. */
export interface ConversionClaimModifier {
  describe(): string;
  adjust(item: ConversionClaim, value: number): number;
}

export class ConversionClaimBudgetOffsetAdjuster implements ConversionClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionClaim, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredConversionClaimAdjuster implements ConversionClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapConversionClaimAdjuster implements ConversionClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumConversionClaimAdjuster implements ConversionClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedConversionClaimAdjuster implements ConversionClaimModifier {
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

  adjust(item: ConversionClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentConversionClaimAdjuster implements ConversionClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion claim steps in order and keeps a trace of each. */
export class ConversionClaimEngine {
  steps: ConversionClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionClaim): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ConversionClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionClaimEngine(flagsValue: flags.Registry): ConversionClaimEngine {
  return new ConversionClaimEngine(
    [
      new ConversionClaimBudgetOffsetAdjuster(1.53),
      new TieredConversionClaimAdjuster([728, 1924, 2137, 5692], [0.88, 1.18, 0.87, 1.09]),
      new CapConversionClaimAdjuster(36005),
      new MinimumConversionClaimAdjuster(7.6),
      new FlaggedConversionClaimAdjuster(flagsValue, "conversion-claim-scheduled", 5.5),
      new PercentConversionClaimAdjuster(3.2),
    ],
    [],
    3.5,
    49656.3,
  );
}
