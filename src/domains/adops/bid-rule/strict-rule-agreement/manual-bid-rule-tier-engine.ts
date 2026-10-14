import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualBidRuleTier } from "./manual-bid-rule-tier.js";

/** One step of the manual bid rule tier calculation. */
export interface ManualBidRuleTierFactor {
  describe(): string;
  adjust(item: ManualBidRuleTier, value: number): number;
}

export class FlaggedManualBidRuleTierAdjuster implements ManualBidRuleTierFactor {
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

  adjust(item: ManualBidRuleTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentManualBidRuleTierAdjuster implements ManualBidRuleTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualBidRuleTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ManualBidRuleTierMaximumOffsetAdjuster implements ManualBidRuleTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: ManualBidRuleTier, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumManualBidRuleTierAdjuster implements ManualBidRuleTierFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualBidRuleTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualBidRuleTierAdjuster implements ManualBidRuleTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBidRuleTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual bid rule tier steps in order and keeps a trace of each. */
export class ManualBidRuleTierEngine {
  steps: ManualBidRuleTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBidRuleTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualBidRuleTier): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ManualBidRuleTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualBidRuleTierEngine(flagsValue: flags.Registry): ManualBidRuleTierEngine {
  return new ManualBidRuleTierEngine(
    [
      new FlaggedManualBidRuleTierAdjuster(flagsValue, "manual-bid-rule-tier-primary", 5.8),
      new PercentManualBidRuleTierAdjuster(8),
      new ManualBidRuleTierMaximumOffsetAdjuster(1.41),
      new MinimumManualBidRuleTierAdjuster(37.6),
      new CapManualBidRuleTierAdjuster(13685),
    ],
    [],
    2.9,
    36470.2,
  );
}
