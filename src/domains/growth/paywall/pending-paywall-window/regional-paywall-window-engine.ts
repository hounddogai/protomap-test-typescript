import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPaywallWindow } from "./regional-paywall-window.js";

/** One step of the regional paywall window calculation. */
export interface RegionalPaywallWindowStep {
  describe(): string;
  adjust(item: RegionalPaywallWindow, value: number): number;
}

export class RegionRegionalPaywallWindowAdjuster implements RegionalPaywallWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RegionalPaywallWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalPaywallWindowAdjuster implements RegionalPaywallWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPaywallWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalPaywallWindowAdjuster implements RegionalPaywallWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalPaywallWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalPaywallWindowAdjuster implements RegionalPaywallWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPaywallWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRegionalPaywallWindowAdjuster implements RegionalPaywallWindowStep {
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

  adjust(item: RegionalPaywallWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional paywall window steps in order and keeps a trace of each. */
export class RegionalPaywallWindowEngine {
  steps: RegionalPaywallWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPaywallWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPaywallWindow): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RegionalPaywallWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPaywallWindowEngine(flagsValue: flags.Registry): RegionalPaywallWindowEngine {
  return new RegionalPaywallWindowEngine(
    [
      new RegionRegionalPaywallWindowAdjuster(new Map<string, number>([["south", 1.05]])),
      new PercentRegionalPaywallWindowAdjuster(1.7),
      new MinimumRegionalPaywallWindowAdjuster(41.4),
      new CapRegionalPaywallWindowAdjuster(14388),
      new FlaggedRegionalPaywallWindowAdjuster(flagsValue, "regional-paywall-window-global", 7.5),
    ],
    [],
    4.5,
    59546.1,
  );
}
