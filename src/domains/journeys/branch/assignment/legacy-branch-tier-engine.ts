import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyBranchTier } from "./legacy-branch-tier.js";

/** One step of the legacy branch tier calculation. */
export interface LegacyBranchTierAdjuster {
  describe(): string;
  adjust(item: LegacyBranchTier, value: number): number;
}

export class RoundingLegacyBranchTierAdjuster implements LegacyBranchTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyBranchTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyBranchTierAdjuster implements LegacyBranchTierAdjuster {
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

  adjust(item: LegacyBranchTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleLegacyBranchTierAdjuster implements LegacyBranchTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LegacyBranchTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy branch tier steps in order and keeps a trace of each. */
export class LegacyBranchTierEngine {
  steps: LegacyBranchTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBranchTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyBranchTier): number {
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

  evaluateAll(items: LegacyBranchTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyBranchTierEngine(flagsValue: flags.Registry): LegacyBranchTierEngine {
  return new LegacyBranchTierEngine(
    [
      new RoundingLegacyBranchTierAdjuster(0.25),
      new FlaggedLegacyBranchTierAdjuster(flagsValue, "legacy-branch-tier-batched", -3.2),
      new TitleLegacyBranchTierAdjuster(new Map<string, number>([["west", 0.92]])),
    ],
    [],
    2.5,
    69690.3,
  );
}
