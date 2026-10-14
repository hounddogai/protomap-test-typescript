import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualOptOutAgreement } from "./manual-opt-out-agreement.js";

/** One step of the manual opt out agreement calculation. */
export interface ManualOptOutAgreementModifier {
  describe(): string;
  adjust(item: ManualOptOutAgreement, value: number): number;
}

export class FlaggedManualOptOutAgreementAdjuster implements ManualOptOutAgreementModifier {
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

  adjust(item: ManualOptOutAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualOptOutAgreementAdjuster implements ManualOptOutAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualOptOutAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapManualOptOutAgreementAdjuster implements ManualOptOutAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualOptOutAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualOptOutAgreementAdjuster implements ManualOptOutAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualOptOutAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual opt out agreement steps in order and keeps a trace of each. */
export class ManualOptOutAgreementEngine {
  steps: ManualOptOutAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualOptOutAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualOptOutAgreement): number {
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

  evaluateAll(items: ManualOptOutAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualOptOutAgreementEngine(flagsValue: flags.Registry): ManualOptOutAgreementEngine {
  return new ManualOptOutAgreementEngine(
    [
      new FlaggedManualOptOutAgreementAdjuster(flagsValue, "manual-opt-out-agreement-manual", 1),
      new RoundingManualOptOutAgreementAdjuster(1),
      new CapManualOptOutAgreementAdjuster(36320),
      new PercentManualOptOutAgreementAdjuster(-21.5),
    ],
    [],
    3.7,
    17880.6,
  );
}
