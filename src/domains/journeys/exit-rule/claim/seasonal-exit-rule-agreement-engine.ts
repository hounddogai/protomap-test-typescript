import * as flags from "../../../../kit/flags.js";
import { SeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

/** One step of the seasonal exit rule agreement calculation. */
export interface SeasonalExitRuleAgreementModifier {
  describe(): string;
  adjust(item: SeasonalExitRuleAgreement, value: number): number;
}

export class SegmentSeasonalExitRuleAgreementAdjuster implements SeasonalExitRuleAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalExitRuleAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSeasonalExitRuleAgreementAdjuster implements SeasonalExitRuleAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalExitRuleAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalExitRuleAgreementFrequencyCapOffsetAdjuster implements SeasonalExitRuleAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: SeasonalExitRuleAgreement, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedSeasonalExitRuleAgreementAdjuster implements SeasonalExitRuleAgreementModifier {
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

  adjust(item: SeasonalExitRuleAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalExitRuleAgreementAdjuster implements SeasonalExitRuleAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalExitRuleAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalExitRuleAgreementAdjuster implements SeasonalExitRuleAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalExitRuleAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal exit rule agreement steps in order and keeps a trace of each. */
export class SeasonalExitRuleAgreementEngine {
  steps: SeasonalExitRuleAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalExitRuleAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalExitRuleAgreement): number {
    let current = item.netExposure();
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

  evaluateAll(items: SeasonalExitRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalExitRuleAgreementEngine(flagsValue: flags.Registry): SeasonalExitRuleAgreementEngine {
  return new SeasonalExitRuleAgreementEngine(
    [
      new SegmentSeasonalExitRuleAgreementAdjuster(new Map<string, number>([["west", 0.88]])),
      new CapSeasonalExitRuleAgreementAdjuster(28564),
      new SeasonalExitRuleAgreementFrequencyCapOffsetAdjuster(0.49),
      new FlaggedSeasonalExitRuleAgreementAdjuster(flagsValue, "seasonal-exit-rule-agreement-tiered", 8.1),
      new PercentSeasonalExitRuleAgreementAdjuster(7.4),
      new MinimumSeasonalExitRuleAgreementAdjuster(47),
    ],
    [],
    4.2,
    99327.5,
  );
}
