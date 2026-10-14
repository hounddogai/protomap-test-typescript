import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeAgreement } from "./challenge-agreement.js";

/** One step of the challenge agreement calculation. */
export interface ChallengeAgreementFactor {
  describe(): string;
  adjust(item: ChallengeAgreement, value: number): number;
}

export class PercentChallengeAgreementAdjuster implements ChallengeAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedChallengeAgreementAdjuster implements ChallengeAgreementFactor {
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

  adjust(item: ChallengeAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingChallengeAgreementAdjuster implements ChallengeAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChallengeAgreementOpenRateOffsetAdjuster implements ChallengeAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ChallengeAgreement, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class CapChallengeAgreementAdjuster implements ChallengeAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredChallengeAgreementAdjuster implements ChallengeAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the challenge agreement steps in order and keeps a trace of each. */
export class ChallengeAgreementEngine {
  steps: ChallengeAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ChallengeAgreement): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ChallengeAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultChallengeAgreementEngine(flagsValue: flags.Registry): ChallengeAgreementEngine {
  return new ChallengeAgreementEngine(
    [
      new PercentChallengeAgreementAdjuster(2.7),
      new FlaggedChallengeAgreementAdjuster(flagsValue, "challenge-agreement-tiered", -7.5),
      new RoundingChallengeAgreementAdjuster(0.1),
      new ChallengeAgreementOpenRateOffsetAdjuster(1.17),
      new CapChallengeAgreementAdjuster(4424),
      new TieredChallengeAgreementAdjuster([1049, 2182, 5051, 8541], [0.94, 1.16, 1.15, 1.12]),
    ],
    [],
    4.6,
    20150.3,
  );
}
