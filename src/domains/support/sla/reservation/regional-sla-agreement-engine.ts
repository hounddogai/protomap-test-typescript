import * as flags from "../../../../kit/flags.js";
import { RegionalSlaAgreement } from "./regional-sla-agreement.js";

/** One step of the regional sla agreement calculation. */
export interface RegionalSlaAgreementFactor {
  describe(): string;
  adjust(item: RegionalSlaAgreement, value: number): number;
}

export class CapRegionalSlaAgreementAdjuster implements RegionalSlaAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSlaAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalSlaAgreementAdjuster implements RegionalSlaAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSlaAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalSlaAgreementAdjuster implements RegionalSlaAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalSlaAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalSlaAgreementAdjuster implements RegionalSlaAgreementFactor {
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

  adjust(item: RegionalSlaAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional sla agreement steps in order and keeps a trace of each. */
export class RegionalSlaAgreementEngine {
  steps: RegionalSlaAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSlaAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalSlaAgreement): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RegionalSlaAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalSlaAgreementEngine(flagsValue: flags.Registry): RegionalSlaAgreementEngine {
  return new RegionalSlaAgreementEngine(
    [
      new CapRegionalSlaAgreementAdjuster(7006),
      new TieredRegionalSlaAgreementAdjuster([2806, 5273, 9822], [1.12, 0.91, 0.88]),
      new MinimumRegionalSlaAgreementAdjuster(9.5),
      new FlaggedRegionalSlaAgreementAdjuster(flagsValue, "regional-sla-agreement-adaptive", 3.4),
    ],
    [],
    3.1,
    47688.2,
  );
}
