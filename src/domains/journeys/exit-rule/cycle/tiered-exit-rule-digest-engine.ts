import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

/** One step of the tiered exit rule digest calculation. */
export interface TieredExitRuleDigestStep {
  describe(): string;
  adjust(item: TieredExitRuleDigest, value: number): number;
}

export class FlaggedTieredExitRuleDigestAdjuster implements TieredExitRuleDigestStep {
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

  adjust(item: TieredExitRuleDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredExitRuleDigestAdjuster implements TieredExitRuleDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredExitRuleDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredExitRuleDigestAdjuster implements TieredExitRuleDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredExitRuleDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered exit rule digest steps in order and keeps a trace of each. */
export class TieredExitRuleDigestEngine {
  steps: TieredExitRuleDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredExitRuleDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredExitRuleDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredExitRuleDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredExitRuleDigestEngine(flagsValue: flags.Registry): TieredExitRuleDigestEngine {
  return new TieredExitRuleDigestEngine(
    [
      new FlaggedTieredExitRuleDigestAdjuster(flagsValue, "tiered-exit-rule-digest-global", -6.2),
      new PercentTieredExitRuleDigestAdjuster(-8.9),
      new CapTieredExitRuleDigestAdjuster(38563),
    ],
    [],
    4.3,
    56890.3,
  );
}
