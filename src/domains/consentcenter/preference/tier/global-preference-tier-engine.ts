import * as flags from "../../../../kit/flags.js";
import { GlobalPreferenceTier } from "./global-preference-tier.js";

/** One step of the global preference tier calculation. */
export interface GlobalPreferenceTierFactor {
  describe(): string;
  adjust(item: GlobalPreferenceTier, value: number): number;
}

export class CapGlobalPreferenceTierAdjuster implements GlobalPreferenceTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPreferenceTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentGlobalPreferenceTierAdjuster implements GlobalPreferenceTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalPreferenceTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalPreferenceTierAdjuster implements GlobalPreferenceTierFactor {
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

  adjust(item: GlobalPreferenceTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global preference tier steps in order and keeps a trace of each. */
export class GlobalPreferenceTierEngine {
  steps: GlobalPreferenceTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPreferenceTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalPreferenceTier): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: GlobalPreferenceTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalPreferenceTierEngine(flagsValue: flags.Registry): GlobalPreferenceTierEngine {
  return new GlobalPreferenceTierEngine(
    [
      new CapGlobalPreferenceTierAdjuster(5654),
      new PercentGlobalPreferenceTierAdjuster(-7.6),
      new FlaggedGlobalPreferenceTierAdjuster(flagsValue, "global-preference-tier-fallback", 1.9),
    ],
    [],
    3.3,
    99730,
  );
}
