import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalRetentionTier } from "./global-retention-tier.js";

/** One step of the global retention tier calculation. */
export interface GlobalRetentionTierModifier {
  describe(): string;
  adjust(item: GlobalRetentionTier, value: number): number;
}

export class PercentGlobalRetentionTierAdjuster implements GlobalRetentionTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRetentionTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionGlobalRetentionTierAdjuster implements GlobalRetentionTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: GlobalRetentionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedGlobalRetentionTierAdjuster implements GlobalRetentionTierModifier {
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

  adjust(item: GlobalRetentionTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalRetentionTierAdjuster implements GlobalRetentionTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRetentionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalRetentionTierRevisionOffsetAdjuster implements GlobalRetentionTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: GlobalRetentionTier, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class RoundingGlobalRetentionTierAdjuster implements GlobalRetentionTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalRetentionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global retention tier steps in order and keeps a trace of each. */
export class GlobalRetentionTierEngine {
  steps: GlobalRetentionTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRetentionTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalRetentionTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: GlobalRetentionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalRetentionTierEngine(flagsValue: flags.Registry): GlobalRetentionTierEngine {
  return new GlobalRetentionTierEngine(
    [
      new PercentGlobalRetentionTierAdjuster(-16.1),
      new RegionGlobalRetentionTierAdjuster(new Map<string, number>([["east", 0.81]])),
      new FlaggedGlobalRetentionTierAdjuster(flagsValue, "global-retention-tier-regional", -6.3),
      new CapGlobalRetentionTierAdjuster(11269),
      new GlobalRetentionTierRevisionOffsetAdjuster(1.5),
      new RoundingGlobalRetentionTierAdjuster(1),
    ],
    [],
    0.4,
    49978.1,
  );
}
