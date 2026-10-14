import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditAudit } from "./credit-audit.js";

/** One step of the credit audit calculation. */
export interface CreditAuditModifier {
  describe(): string;
  adjust(item: CreditAudit, value: number): number;
}

export class FlaggedCreditAuditAdjuster implements CreditAuditModifier {
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

  adjust(item: CreditAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditAuditAdjuster implements CreditAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCreditAuditAdjuster implements CreditAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreditAuditAdjuster implements CreditAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit audit steps in order and keeps a trace of each. */
export class CreditAuditEngine {
  steps: CreditAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditAudit): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: CreditAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditAuditEngine(flagsValue: flags.Registry): CreditAuditEngine {
  return new CreditAuditEngine(
    [
      new FlaggedCreditAuditAdjuster(flagsValue, "credit-audit-weighted", -5.8),
      new RoundingCreditAuditAdjuster(0.5),
      new TieredCreditAuditAdjuster([1151, 8414], [0.86, 1.15]),
      new PercentCreditAuditAdjuster(-13.8),
    ],
    [],
    3.8,
    66115.9,
  );
}
