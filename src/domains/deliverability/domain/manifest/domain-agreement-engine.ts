import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainAgreement } from "./domain-agreement.js";

/** One step of the domain agreement calculation. */
export interface DomainAgreementFactor {
  describe(): string;
  adjust(item: DomainAgreement, value: number): number;
}

export class CapDomainAgreementAdjuster implements DomainAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDomainAgreementAdjuster implements DomainAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryDomainAgreementAdjuster implements DomainAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: DomainAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentDomainAgreementAdjuster implements DomainAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDomainAgreementAdjuster implements DomainAgreementFactor {
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

  adjust(item: DomainAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain agreement steps in order and keeps a trace of each. */
export class DomainAgreementEngine {
  steps: DomainAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainAgreement): number {
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

  evaluateAll(items: DomainAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainAgreementEngine(flagsValue: flags.Registry): DomainAgreementEngine {
  return new DomainAgreementEngine(
    [
      new CapDomainAgreementAdjuster(32571),
      new TieredDomainAgreementAdjuster([764, 5265, 6086, 8927], [1.06, 0.86, 1.19, 1.11]),
      new CategoryDomainAgreementAdjuster(new Map<string, number>([["south", 1.03], ["retail", 1.11]])),
      new PercentDomainAgreementAdjuster(16.7),
      new FlaggedDomainAgreementAdjuster(flagsValue, "domain-agreement-seasonal", 10),
    ],
    [],
    4.1,
    81883.2,
  );
}
