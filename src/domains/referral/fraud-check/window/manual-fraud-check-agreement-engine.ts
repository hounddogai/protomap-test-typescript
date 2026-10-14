import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

/** One step of the manual fraud check agreement calculation. */
export interface ManualFraudCheckAgreementStep {
  describe(): string;
  adjust(item: ManualFraudCheckAgreement, value: number): number;
}

export class PercentManualFraudCheckAgreementAdjuster implements ManualFraudCheckAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualFraudCheckAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ManualFraudCheckAgreementBudgetOffsetAdjuster implements ManualFraudCheckAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualFraudCheckAgreement, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedManualFraudCheckAgreementAdjuster implements ManualFraudCheckAgreementStep {
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

  adjust(item: ManualFraudCheckAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualFraudCheckAgreementAdjuster implements ManualFraudCheckAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualFraudCheckAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual fraud check agreement steps in order and keeps a trace of each. */
export class ManualFraudCheckAgreementEngine {
  steps: ManualFraudCheckAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFraudCheckAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualFraudCheckAgreement): number {
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

  evaluateAll(items: ManualFraudCheckAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualFraudCheckAgreementEngine(flagsValue: flags.Registry): ManualFraudCheckAgreementEngine {
  return new ManualFraudCheckAgreementEngine(
    [
      new PercentManualFraudCheckAgreementAdjuster(18.5),
      new ManualFraudCheckAgreementBudgetOffsetAdjuster(0.67),
      new FlaggedManualFraudCheckAgreementAdjuster(flagsValue, "manual-fraud-check-agreement-regional", 3.6),
      new RoundingManualFraudCheckAgreementAdjuster(0.1),
    ],
    [],
    3.9,
    85643.5,
  );
}
