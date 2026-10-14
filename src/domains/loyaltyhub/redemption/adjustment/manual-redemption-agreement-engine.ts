import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualRedemptionAgreement } from "./manual-redemption-agreement.js";

/** One step of the manual redemption agreement calculation. */
export interface ManualRedemptionAgreementModifier {
  describe(): string;
  adjust(item: ManualRedemptionAgreement, value: number): number;
}

export class RoundingManualRedemptionAgreementAdjuster implements ManualRedemptionAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRedemptionAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentManualRedemptionAgreementAdjuster implements ManualRedemptionAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRedemptionAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedManualRedemptionAgreementAdjuster implements ManualRedemptionAgreementModifier {
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

  adjust(item: ManualRedemptionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualRedemptionAgreementAdjuster implements ManualRedemptionAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRedemptionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualRedemptionAgreementAdjuster implements ManualRedemptionAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRedemptionAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ManualRedemptionAgreementSequenceOffsetAdjuster implements ManualRedemptionAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ManualRedemptionAgreement, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the manual redemption agreement steps in order and keeps a trace of each. */
export class ManualRedemptionAgreementEngine {
  steps: ManualRedemptionAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRedemptionAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualRedemptionAgreement): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ManualRedemptionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualRedemptionAgreementEngine(flagsValue: flags.Registry): ManualRedemptionAgreementEngine {
  return new ManualRedemptionAgreementEngine(
    [
      new RoundingManualRedemptionAgreementAdjuster(0.05),
      new PercentManualRedemptionAgreementAdjuster(-23.9),
      new FlaggedManualRedemptionAgreementAdjuster(flagsValue, "manual-redemption-agreement-strict", -5.3),
      new CapManualRedemptionAgreementAdjuster(19214),
      new MinimumManualRedemptionAgreementAdjuster(34),
      new ManualRedemptionAgreementSequenceOffsetAdjuster(1.75),
    ],
    [],
    0.5,
    95485.1,
  );
}
