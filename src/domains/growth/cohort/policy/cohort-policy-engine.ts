import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortPolicy } from "./cohort-policy.js";

/** One step of the cohort policy calculation. */
export interface CohortPolicyFactor {
  describe(): string;
  adjust(item: CohortPolicy, value: number): number;
}

export class FlaggedCohortPolicyAdjuster implements CohortPolicyFactor {
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

  adjust(item: CohortPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CohortPolicyClicksOffsetAdjuster implements CohortPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: CohortPolicy, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class RoundingCohortPolicyAdjuster implements CohortPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCohortPolicyAdjuster implements CohortPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the cohort policy steps in order and keeps a trace of each. */
export class CohortPolicyEngine {
  steps: CohortPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortPolicy): number {
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

  evaluateAll(items: CohortPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortPolicyEngine(flagsValue: flags.Registry): CohortPolicyEngine {
  return new CohortPolicyEngine(
    [
      new FlaggedCohortPolicyAdjuster(flagsValue, "cohort-policy-batched", -9.5),
      new CohortPolicyClicksOffsetAdjuster(1.04),
      new RoundingCohortPolicyAdjuster(0.05),
      new PercentCohortPolicyAdjuster(6.5),
    ],
    [],
    4.1,
    60104.5,
  );
}
