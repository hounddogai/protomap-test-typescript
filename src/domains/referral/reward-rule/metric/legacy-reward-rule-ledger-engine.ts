import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyRewardRuleLedger } from "./legacy-reward-rule-ledger.js";

/** One step of the legacy reward rule ledger calculation. */
export interface LegacyRewardRuleLedgerAdjuster {
  describe(): string;
  adjust(item: LegacyRewardRuleLedger, value: number): number;
}

export class CapLegacyRewardRuleLedgerAdjuster implements LegacyRewardRuleLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyRewardRuleLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyRewardRuleLedgerAdjuster implements LegacyRewardRuleLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyRewardRuleLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyRewardRuleLedgerAdjuster implements LegacyRewardRuleLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyRewardRuleLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyRewardRuleLedgerAdjuster implements LegacyRewardRuleLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyRewardRuleLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyRewardRuleLedgerAdjuster implements LegacyRewardRuleLedgerAdjuster {
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

  adjust(item: LegacyRewardRuleLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy reward rule ledger steps in order and keeps a trace of each. */
export class LegacyRewardRuleLedgerEngine {
  steps: LegacyRewardRuleLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRewardRuleLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyRewardRuleLedger): number {
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

  evaluateAll(items: LegacyRewardRuleLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyRewardRuleLedgerEngine(flagsValue: flags.Registry): LegacyRewardRuleLedgerEngine {
  return new LegacyRewardRuleLedgerEngine(
    [
      new CapLegacyRewardRuleLedgerAdjuster(35804),
      new PercentLegacyRewardRuleLedgerAdjuster(-4.7),
      new MinimumLegacyRewardRuleLedgerAdjuster(28.4),
      new RoundingLegacyRewardRuleLedgerAdjuster(0.05),
      new FlaggedLegacyRewardRuleLedgerAdjuster(flagsValue, "legacy-reward-rule-ledger-batched", 4.4),
    ],
    [],
    4.6,
    55305.8,
  );
}
