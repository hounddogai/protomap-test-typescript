import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelPolicy } from "./level-policy.js";

/** One step of the level policy calculation. */
export interface LevelPolicyFactor {
  describe(): string;
  adjust(item: LevelPolicy, value: number): number;
}

export class FlaggedLevelPolicyAdjuster implements LevelPolicyFactor {
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

  adjust(item: LevelPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameLevelPolicyAdjuster implements LevelPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LevelPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLevelPolicyAdjuster implements LevelPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLevelPolicyAdjuster implements LevelPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level policy steps in order and keeps a trace of each. */
export class LevelPolicyEngine {
  steps: LevelPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelPolicy): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LevelPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelPolicyEngine(flagsValue: flags.Registry): LevelPolicyEngine {
  return new LevelPolicyEngine(
    [
      new FlaggedLevelPolicyAdjuster(flagsValue, "level-policy-default", -6.7),
      new NameLevelPolicyAdjuster(new Map<string, number>([["east", 1.22], ["retail", 1.33], ["online", 0.97]])),
      new RoundingLevelPolicyAdjuster(0.1),
      new PercentLevelPolicyAdjuster(-5),
    ],
    [],
    3.7,
    9556.4,
  );
}
