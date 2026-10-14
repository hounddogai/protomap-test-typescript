import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditException } from "./credit-exception.js";

/** One step of the credit exception calculation. */
export interface CreditExceptionModifier {
  describe(): string;
  adjust(item: CreditException, value: number): number;
}

export class FlaggedCreditExceptionAdjuster implements CreditExceptionModifier {
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

  adjust(item: CreditException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditExceptionAdjuster implements CreditExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCreditExceptionAdjuster implements CreditExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CreditExceptionWindowDaysOffsetAdjuster implements CreditExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: CreditException, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class PercentCreditExceptionAdjuster implements CreditExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit exception steps in order and keeps a trace of each. */
export class CreditExceptionEngine {
  steps: CreditExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditException): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CreditException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditExceptionEngine(flagsValue: flags.Registry): CreditExceptionEngine {
  return new CreditExceptionEngine(
    [
      new FlaggedCreditExceptionAdjuster(flagsValue, "credit-exception-primary", -0.7),
      new RoundingCreditExceptionAdjuster(5),
      new MinimumCreditExceptionAdjuster(29.1),
      new CreditExceptionWindowDaysOffsetAdjuster(1.75),
      new PercentCreditExceptionAdjuster(-17.7),
    ],
    [],
    1.2,
    63458,
  );
}
