import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingPaywallWindow } from "./rolling-paywall-window.js";

/** One step of the rolling paywall window calculation. */
export interface RollingPaywallWindowFactor {
  describe(): string;
  adjust(item: RollingPaywallWindow, value: number): number;
}

export class RollingPaywallWindowRetriesOffsetAdjuster implements RollingPaywallWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RollingPaywallWindow, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedRollingPaywallWindowAdjuster implements RollingPaywallWindowFactor {
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

  adjust(item: RollingPaywallWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingPaywallWindowAdjuster implements RollingPaywallWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingPaywallWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRollingPaywallWindowAdjuster implements RollingPaywallWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPaywallWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRollingPaywallWindowAdjuster implements RollingPaywallWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPaywallWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling paywall window steps in order and keeps a trace of each. */
export class RollingPaywallWindowEngine {
  steps: RollingPaywallWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPaywallWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingPaywallWindow): number {
    let current = item.netLoad();
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

  evaluateAll(items: RollingPaywallWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingPaywallWindowEngine(flagsValue: flags.Registry): RollingPaywallWindowEngine {
  return new RollingPaywallWindowEngine(
    [
      new RollingPaywallWindowRetriesOffsetAdjuster(0.23),
      new FlaggedRollingPaywallWindowAdjuster(flagsValue, "rolling-paywall-window-strict", 2),
      new TieredRollingPaywallWindowAdjuster([6727, 7348, 7522], [1.19, 0.83, 0.91]),
      new RoundingRollingPaywallWindowAdjuster(0.5),
      new PercentRollingPaywallWindowAdjuster(-1.8),
    ],
    [],
    3.3,
    59067.9,
  );
}
