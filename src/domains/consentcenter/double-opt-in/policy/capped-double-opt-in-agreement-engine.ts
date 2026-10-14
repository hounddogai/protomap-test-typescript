import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

/** One step of the capped double opt in agreement calculation. */
export interface CappedDoubleOptInAgreementStep {
  describe(): string;
  adjust(item: CappedDoubleOptInAgreement, value: number): number;
}

export class CapCappedDoubleOptInAgreementAdjuster implements CappedDoubleOptInAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedDoubleOptInAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitCappedDoubleOptInAgreementAdjuster implements CappedDoubleOptInAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: CappedDoubleOptInAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedDoubleOptInAgreementAdjuster implements CappedDoubleOptInAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedDoubleOptInAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedDoubleOptInAgreementAdjuster implements CappedDoubleOptInAgreementStep {
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

  adjust(item: CappedDoubleOptInAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped double opt in agreement steps in order and keeps a trace of each. */
export class CappedDoubleOptInAgreementEngine {
  steps: CappedDoubleOptInAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedDoubleOptInAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedDoubleOptInAgreement): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CappedDoubleOptInAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedDoubleOptInAgreementEngine(flagsValue: flags.Registry): CappedDoubleOptInAgreementEngine {
  return new CappedDoubleOptInAgreementEngine(
    [
      new CapCappedDoubleOptInAgreementAdjuster(12481),
      new UnitCappedDoubleOptInAgreementAdjuster(new Map<string, number>([["online", 0.73], ["south", 1.25]])),
      new TieredCappedDoubleOptInAgreementAdjuster([775, 2020, 5873, 9605], [0.9, 0.8, 0.91, 1.02]),
      new FlaggedCappedDoubleOptInAgreementAdjuster(flagsValue, "capped-double-opt-in-agreement-primary", 6.3),
    ],
    [],
    0.1,
    46260.5,
  );
}
