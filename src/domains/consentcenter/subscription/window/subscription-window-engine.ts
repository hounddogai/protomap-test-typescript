import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionWindow } from "./subscription-window.js";

/** One step of the subscription window calculation. */
export interface SubscriptionWindowModifier {
  describe(): string;
  adjust(item: SubscriptionWindow, value: number): number;
}

export class CapSubscriptionWindowAdjuster implements SubscriptionWindowModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSubscriptionWindowAdjuster implements SubscriptionWindowModifier {
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

  adjust(item: SubscriptionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SubscriptionWindowMaximumOffsetAdjuster implements SubscriptionWindowModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: SubscriptionWindow, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class RoundingSubscriptionWindowAdjuster implements SubscriptionWindowModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSubscriptionWindowAdjuster implements SubscriptionWindowModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the subscription window steps in order and keeps a trace of each. */
export class SubscriptionWindowEngine {
  steps: SubscriptionWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SubscriptionWindow): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SubscriptionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSubscriptionWindowEngine(flagsValue: flags.Registry): SubscriptionWindowEngine {
  return new SubscriptionWindowEngine(
    [
      new CapSubscriptionWindowAdjuster(18015),
      new FlaggedSubscriptionWindowAdjuster(flagsValue, "subscription-window-adaptive", 4.6),
      new SubscriptionWindowMaximumOffsetAdjuster(1.26),
      new RoundingSubscriptionWindowAdjuster(1),
      new TieredSubscriptionWindowAdjuster([352, 2517, 9020], [0.85, 1.2, 1.07]),
    ],
    [],
    1.6,
    98244.7,
  );
}
