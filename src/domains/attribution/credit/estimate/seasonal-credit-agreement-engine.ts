import * as flags from "../../../../kit/flags.js";
import { SeasonalCreditAgreement } from "./seasonal-credit-agreement.js";

/** One step of the seasonal credit agreement calculation. */
export interface SeasonalCreditAgreementModifier {
  describe(): string;
  adjust(item: SeasonalCreditAgreement, value: number): number;
}

export class UtmSourceSeasonalCreditAgreementAdjuster implements SeasonalCreditAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: SeasonalCreditAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumSeasonalCreditAgreementAdjuster implements SeasonalCreditAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalCreditAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSeasonalCreditAgreementAdjuster implements SeasonalCreditAgreementModifier {
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

  adjust(item: SeasonalCreditAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalCreditAgreementFloorValueOffsetAdjuster implements SeasonalCreditAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: SeasonalCreditAgreement, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class PercentSeasonalCreditAgreementAdjuster implements SeasonalCreditAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCreditAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal credit agreement steps in order and keeps a trace of each. */
export class SeasonalCreditAgreementEngine {
  steps: SeasonalCreditAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCreditAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalCreditAgreement): number {
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

  evaluateAll(items: SeasonalCreditAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalCreditAgreementEngine(flagsValue: flags.Registry): SeasonalCreditAgreementEngine {
  return new SeasonalCreditAgreementEngine(
    [
      new UtmSourceSeasonalCreditAgreementAdjuster(new Map<string, number>([["north", 1.29]])),
      new MinimumSeasonalCreditAgreementAdjuster(1),
      new FlaggedSeasonalCreditAgreementAdjuster(flagsValue, "seasonal-credit-agreement-pending", -2.9),
      new SeasonalCreditAgreementFloorValueOffsetAdjuster(0.5),
      new PercentSeasonalCreditAgreementAdjuster(-18.8),
    ],
    [],
    4,
    76074.4,
  );
}
