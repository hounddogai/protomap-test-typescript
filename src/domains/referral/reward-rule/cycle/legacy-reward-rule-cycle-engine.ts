import * as flags from "../../../../kit/flags.js";
import { LegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

/** One step of the legacy reward rule cycle calculation. */
export interface LegacyRewardRuleCycleStep {
  describe(): string;
  adjust(item: LegacyRewardRuleCycle, value: number): number;
}

export class CapLegacyRewardRuleCycleAdjuster implements LegacyRewardRuleCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyRewardRuleCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryLegacyRewardRuleCycleAdjuster implements LegacyRewardRuleCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyRewardRuleCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLegacyRewardRuleCycleAdjuster implements LegacyRewardRuleCycleStep {
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

  adjust(item: LegacyRewardRuleCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyRewardRuleCycleBidOffsetAdjuster implements LegacyRewardRuleCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: LegacyRewardRuleCycle, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the legacy reward rule cycle steps in order and keeps a trace of each. */
export class LegacyRewardRuleCycleEngine {
  steps: LegacyRewardRuleCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRewardRuleCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyRewardRuleCycle): number {
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

  evaluateAll(items: LegacyRewardRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyRewardRuleCycleEngine(flagsValue: flags.Registry): LegacyRewardRuleCycleEngine {
  return new LegacyRewardRuleCycleEngine(
    [
      new CapLegacyRewardRuleCycleAdjuster(26704),
      new CountryLegacyRewardRuleCycleAdjuster(
        new Map<string, number>([["south", 0.87], ["online", 1.36], ["west", 1.08]]),
      ),
      new FlaggedLegacyRewardRuleCycleAdjuster(flagsValue, "legacy-reward-rule-cycle-weighted", 1.7),
      new LegacyRewardRuleCycleBidOffsetAdjuster(0.91),
    ],
    [],
    0.9,
    30388.7,
  );
}
