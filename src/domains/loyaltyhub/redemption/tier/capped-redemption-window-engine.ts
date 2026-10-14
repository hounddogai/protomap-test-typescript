import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedRedemptionWindow } from "./capped-redemption-window.js";

/** One step of the capped redemption window calculation. */
export interface CappedRedemptionWindowStep {
  describe(): string;
  adjust(item: CappedRedemptionWindow, value: number): number;
}

export class FlaggedCappedRedemptionWindowAdjuster implements CappedRedemptionWindowStep {
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

  adjust(item: CappedRedemptionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameCappedRedemptionWindowAdjuster implements CappedRedemptionWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedRedemptionWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCappedRedemptionWindowAdjuster implements CappedRedemptionWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedRedemptionWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedRedemptionWindowAdjuster implements CappedRedemptionWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedRedemptionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped redemption window steps in order and keeps a trace of each. */
export class CappedRedemptionWindowEngine {
  steps: CappedRedemptionWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedRedemptionWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedRedemptionWindow): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CappedRedemptionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedRedemptionWindowEngine(flagsValue: flags.Registry): CappedRedemptionWindowEngine {
  return new CappedRedemptionWindowEngine(
    [
      new FlaggedCappedRedemptionWindowAdjuster(flagsValue, "capped-redemption-window-legacy", 4.6),
      new NameCappedRedemptionWindowAdjuster(
        new Map<string, number>([["central", 1.14], ["north", 0.9], ["online", 0.85]]),
      ),
      new PercentCappedRedemptionWindowAdjuster(5.2),
      new TieredCappedRedemptionWindowAdjuster([2473, 5840], [1.04, 0.92]),
    ],
    [],
    4.2,
    71566.8,
  );
}
