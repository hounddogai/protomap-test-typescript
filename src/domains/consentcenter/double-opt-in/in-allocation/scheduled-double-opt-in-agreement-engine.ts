import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledDoubleOptInAgreement } from "./scheduled-double-opt-in-agreement.js";

/** One step of the scheduled double opt in agreement calculation. */
export interface ScheduledDoubleOptInAgreementStep {
  describe(): string;
  adjust(item: ScheduledDoubleOptInAgreement, value: number): number;
}

export class FlaggedScheduledDoubleOptInAgreementAdjuster implements ScheduledDoubleOptInAgreementStep {
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

  adjust(item: ScheduledDoubleOptInAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledDoubleOptInAgreementAdjuster implements ScheduledDoubleOptInAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledDoubleOptInAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelScheduledDoubleOptInAgreementAdjuster implements ScheduledDoubleOptInAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledDoubleOptInAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled double opt in agreement steps in order and keeps a trace of each. */
export class ScheduledDoubleOptInAgreementEngine {
  steps: ScheduledDoubleOptInAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDoubleOptInAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledDoubleOptInAgreement): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ScheduledDoubleOptInAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledDoubleOptInAgreementEngine(flagsValue: flags.Registry): ScheduledDoubleOptInAgreementEngine {
  return new ScheduledDoubleOptInAgreementEngine(
    [
      new FlaggedScheduledDoubleOptInAgreementAdjuster(
        flagsValue,
        "scheduled-double-opt-in-agreement-adaptive",
        -2.5,
      ),
      new TieredScheduledDoubleOptInAgreementAdjuster([254, 7635], [1.08, 0.84]),
      new LabelScheduledDoubleOptInAgreementAdjuster(new Map<string, number>([["central", 0.72]])),
    ],
    [],
    0.1,
    53027.7,
  );
}
