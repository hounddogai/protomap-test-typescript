import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

/** One step of the lenient suppression agreement calculation. */
export interface LenientSuppressionAgreementFactor {
  describe(): string;
  adjust(item: LenientSuppressionAgreement, value: number): number;
}

export class LenientSuppressionAgreementThresholdOffsetAdjuster implements LenientSuppressionAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LenientSuppressionAgreement, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedLenientSuppressionAgreementAdjuster implements LenientSuppressionAgreementFactor {
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

  adjust(item: LenientSuppressionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientSuppressionAgreementAdjuster implements LenientSuppressionAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientSuppressionAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient suppression agreement steps in order and keeps a trace of each. */
export class LenientSuppressionAgreementEngine {
  steps: LenientSuppressionAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSuppressionAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientSuppressionAgreement): number {
    let current = item.netValue();
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

  evaluateAll(items: LenientSuppressionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientSuppressionAgreementEngine(flagsValue: flags.Registry): LenientSuppressionAgreementEngine {
  return new LenientSuppressionAgreementEngine(
    [
      new LenientSuppressionAgreementThresholdOffsetAdjuster(0.33),
      new FlaggedLenientSuppressionAgreementAdjuster(flagsValue, "lenient-suppression-agreement-default", -4.3),
      new RoundingLenientSuppressionAgreementAdjuster(1),
    ],
    [],
    4.9,
    95982.8,
  );
}
