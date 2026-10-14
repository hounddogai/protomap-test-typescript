import * as flags from "../../../../kit/flags.js";
import { ConversionAgreement } from "./conversion-agreement.js";

/** One step of the conversion agreement calculation. */
export interface ConversionAgreementStep {
  describe(): string;
  adjust(item: ConversionAgreement, value: number): number;
}

export class RegionConversionAgreementAdjuster implements ConversionAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ConversionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ConversionAgreementRevisionOffsetAdjuster implements ConversionAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ConversionAgreement, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class MinimumConversionAgreementAdjuster implements ConversionAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedConversionAgreementAdjuster implements ConversionAgreementStep {
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

  adjust(item: ConversionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredConversionAgreementAdjuster implements ConversionAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the conversion agreement steps in order and keeps a trace of each. */
export class ConversionAgreementEngine {
  steps: ConversionAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ConversionAgreement): number {
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

  evaluateAll(items: ConversionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultConversionAgreementEngine(flagsValue: flags.Registry): ConversionAgreementEngine {
  return new ConversionAgreementEngine(
    [
      new RegionConversionAgreementAdjuster(new Map<string, number>([["west", 1.19]])),
      new ConversionAgreementRevisionOffsetAdjuster(1.56),
      new MinimumConversionAgreementAdjuster(13.5),
      new FlaggedConversionAgreementAdjuster(flagsValue, "conversion-agreement-global", -3.2),
      new TieredConversionAgreementAdjuster([430, 682, 2131, 4722], [1.04, 1.06, 1.07, 1.01]),
    ],
    [],
    0.2,
    33950.6,
  );
}
