import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryMacroQuota } from "./primary-macro-quota.js";

/** One step of the primary macro quota calculation. */
export interface PrimaryMacroQuotaStep {
  describe(): string;
  adjust(item: PrimaryMacroQuota, value: number): number;
}

export class PrimaryMacroQuotaCeilingOffsetAdjuster implements PrimaryMacroQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PrimaryMacroQuota, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class NamePrimaryMacroQuotaAdjuster implements PrimaryMacroQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryMacroQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryMacroQuotaAdjuster implements PrimaryMacroQuotaStep {
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

  adjust(item: PrimaryMacroQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryMacroQuotaAdjuster implements PrimaryMacroQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryMacroQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary macro quota steps in order and keeps a trace of each. */
export class PrimaryMacroQuotaEngine {
  steps: PrimaryMacroQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryMacroQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryMacroQuota): number {
    let current = item.netLoad();
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

  evaluateAll(items: PrimaryMacroQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryMacroQuotaEngine(flagsValue: flags.Registry): PrimaryMacroQuotaEngine {
  return new PrimaryMacroQuotaEngine(
    [
      new PrimaryMacroQuotaCeilingOffsetAdjuster(1.36),
      new NamePrimaryMacroQuotaAdjuster(
        new Map<string, number>([["north", 1.15], ["central", 1.16], ["west", 1.35]]),
      ),
      new FlaggedPrimaryMacroQuotaAdjuster(flagsValue, "primary-macro-quota-default", -2.9),
      new RoundingPrimaryMacroQuotaAdjuster(0.1),
    ],
    [],
    1.7,
    60724.1,
  );
}
