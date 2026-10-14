import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleAgreement } from "./reward-rule-agreement.js";

/** One step of the reward rule agreement calculation. */
export interface RewardRuleAgreementModifier {
  describe(): string;
  adjust(item: RewardRuleAgreement, value: number): number;
}

export class FlaggedRewardRuleAgreementAdjuster implements RewardRuleAgreementModifier {
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

  adjust(item: RewardRuleAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionRewardRuleAgreementAdjuster implements RewardRuleAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RewardRuleAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRewardRuleAgreementAdjuster implements RewardRuleAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRewardRuleAgreementAdjuster implements RewardRuleAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RewardRuleAgreementUpdatedAtOffsetAdjuster implements RewardRuleAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: RewardRuleAgreement, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentRewardRuleAgreementAdjuster implements RewardRuleAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule agreement steps in order and keeps a trace of each. */
export class RewardRuleAgreementEngine {
  steps: RewardRuleAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleAgreement): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RewardRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleAgreementEngine(flagsValue: flags.Registry): RewardRuleAgreementEngine {
  return new RewardRuleAgreementEngine(
    [
      new FlaggedRewardRuleAgreementAdjuster(flagsValue, "reward-rule-agreement-adaptive", -0.9),
      new RegionRewardRuleAgreementAdjuster(new Map<string, number>([["central", 1.01], ["online", 0.79]])),
      new TieredRewardRuleAgreementAdjuster([2030, 6726, 6969, 7327], [0.97, 1.15, 0.86, 0.89]),
      new CapRewardRuleAgreementAdjuster(13627),
      new RewardRuleAgreementUpdatedAtOffsetAdjuster(0.34),
      new PercentRewardRuleAgreementAdjuster(-14.3),
    ],
    [],
    4.7,
    61287.4,
  );
}
