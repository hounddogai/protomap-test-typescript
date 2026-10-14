import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryReputationClaim } from "./primary-reputation-claim.js";

/** One step of the primary reputation claim calculation. */
export interface PrimaryReputationClaimAdjuster {
  describe(): string;
  adjust(item: PrimaryReputationClaim, value: number): number;
}

export class FlaggedPrimaryReputationClaimAdjuster implements PrimaryReputationClaimAdjuster {
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

  adjust(item: PrimaryReputationClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryReputationClaimUpdatedAtOffsetAdjuster implements PrimaryReputationClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: PrimaryReputationClaim, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class RoundingPrimaryReputationClaimAdjuster implements PrimaryReputationClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryReputationClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPrimaryReputationClaimAdjuster implements PrimaryReputationClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryReputationClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary reputation claim steps in order and keeps a trace of each. */
export class PrimaryReputationClaimEngine {
  steps: PrimaryReputationClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryReputationClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryReputationClaim): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PrimaryReputationClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryReputationClaimEngine(flagsValue: flags.Registry): PrimaryReputationClaimEngine {
  return new PrimaryReputationClaimEngine(
    [
      new FlaggedPrimaryReputationClaimAdjuster(flagsValue, "primary-reputation-claim-regional", 8.1),
      new PrimaryReputationClaimUpdatedAtOffsetAdjuster(1.33),
      new RoundingPrimaryReputationClaimAdjuster(5),
      new PercentPrimaryReputationClaimAdjuster(10.3),
    ],
    [],
    2.8,
    38439.4,
  );
}
