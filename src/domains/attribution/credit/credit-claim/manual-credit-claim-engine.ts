import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualCreditClaim } from "./manual-credit-claim.js";

/** One step of the manual credit claim calculation. */
export interface ManualCreditClaimModifier {
  describe(): string;
  adjust(item: ManualCreditClaim, value: number): number;
}

export class RoundingManualCreditClaimAdjuster implements ManualCreditClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualCreditClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualCreditClaimAdjuster implements ManualCreditClaimModifier {
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

  adjust(item: ManualCreditClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualCreditClaimAdjuster implements ManualCreditClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualCreditClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual credit claim steps in order and keeps a trace of each. */
export class ManualCreditClaimEngine {
  steps: ManualCreditClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualCreditClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualCreditClaim): number {
    let current = item.netTotal();
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

  evaluateAll(items: ManualCreditClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualCreditClaimEngine(flagsValue: flags.Registry): ManualCreditClaimEngine {
  return new ManualCreditClaimEngine(
    [
      new RoundingManualCreditClaimAdjuster(5),
      new FlaggedManualCreditClaimAdjuster(flagsValue, "manual-credit-claim-manual", -4.7),
      new MinimumManualCreditClaimAdjuster(48.3),
    ],
    [],
    4,
    65281.2,
  );
}
