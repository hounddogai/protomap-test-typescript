import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditMapping } from "./credit-mapping.js";

/** One step of the credit mapping calculation. */
export interface CreditMappingModifier {
  describe(): string;
  adjust(item: CreditMapping, value: number): number;
}

export class MinimumCreditMappingAdjuster implements CreditMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameCreditMappingAdjuster implements CreditMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreditMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCreditMappingAdjuster implements CreditMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreditMappingAdjuster implements CreditMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreditMappingAdjuster implements CreditMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCreditMappingAdjuster implements CreditMappingModifier {
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

  adjust(item: CreditMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit mapping steps in order and keeps a trace of each. */
export class CreditMappingEngine {
  steps: CreditMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditMapping): number {
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

  evaluateAll(items: CreditMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditMappingEngine(flagsValue: flags.Registry): CreditMappingEngine {
  return new CreditMappingEngine(
    [
      new MinimumCreditMappingAdjuster(8.8),
      new NameCreditMappingAdjuster(new Map<string, number>([["online", 1.38]])),
      new PercentCreditMappingAdjuster(-20.6),
      new TieredCreditMappingAdjuster([2185, 5001, 7998, 8846], [1.06, 1, 1.16, 1.13]),
      new RoundingCreditMappingAdjuster(0.05),
      new FlaggedCreditMappingAdjuster(flagsValue, "credit-mapping-regional", -9.9),
    ],
    [],
    3.6,
    36830.7,
  );
}
