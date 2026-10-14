import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

/** One step of the adaptive exit rule snapshot calculation. */
export interface AdaptiveExitRuleSnapshotStep {
  describe(): string;
  adjust(item: AdaptiveExitRuleSnapshot, value: number): number;
}

export class FlaggedAdaptiveExitRuleSnapshotAdjuster implements AdaptiveExitRuleSnapshotStep {
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

  adjust(item: AdaptiveExitRuleSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveExitRuleSnapshotAdjuster implements AdaptiveExitRuleSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveExitRuleSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryAdaptiveExitRuleSnapshotAdjuster implements AdaptiveExitRuleSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: AdaptiveExitRuleSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive exit rule snapshot steps in order and keeps a trace of each. */
export class AdaptiveExitRuleSnapshotEngine {
  steps: AdaptiveExitRuleSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveExitRuleSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveExitRuleSnapshot): number {
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

  evaluateAll(items: AdaptiveExitRuleSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveExitRuleSnapshotEngine(flagsValue: flags.Registry): AdaptiveExitRuleSnapshotEngine {
  return new AdaptiveExitRuleSnapshotEngine(
    [
      new FlaggedAdaptiveExitRuleSnapshotAdjuster(flagsValue, "adaptive-exit-rule-snapshot-capped", -7.7),
      new PercentAdaptiveExitRuleSnapshotAdjuster(19.3),
      new CountryAdaptiveExitRuleSnapshotAdjuster(new Map<string, number>([["north", 1.02]])),
    ],
    [],
    2.5,
    74604.7,
  );
}
