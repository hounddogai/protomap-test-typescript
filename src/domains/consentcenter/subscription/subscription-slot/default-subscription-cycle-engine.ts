import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultSubscriptionCycle } from "./default-subscription-cycle.js";

/** One step of the default subscription cycle calculation. */
export interface DefaultSubscriptionCycleStep {
  describe(): string;
  adjust(item: DefaultSubscriptionCycle, value: number): number;
}

export class DefaultSubscriptionCycleWindowDaysOffsetAdjuster implements DefaultSubscriptionCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: DefaultSubscriptionCycle, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedDefaultSubscriptionCycleAdjuster implements DefaultSubscriptionCycleStep {
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

  adjust(item: DefaultSubscriptionCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultSubscriptionCycleAdjuster implements DefaultSubscriptionCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultSubscriptionCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultSubscriptionCycleAdjuster implements DefaultSubscriptionCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSubscriptionCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default subscription cycle steps in order and keeps a trace of each. */
export class DefaultSubscriptionCycleEngine {
  steps: DefaultSubscriptionCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSubscriptionCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultSubscriptionCycle): number {
    let current = item.weightedValue();
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

  evaluateAll(items: DefaultSubscriptionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultSubscriptionCycleEngine(flagsValue: flags.Registry): DefaultSubscriptionCycleEngine {
  return new DefaultSubscriptionCycleEngine(
    [
      new DefaultSubscriptionCycleWindowDaysOffsetAdjuster(1.65),
      new FlaggedDefaultSubscriptionCycleAdjuster(flagsValue, "default-subscription-cycle-scheduled", 9.2),
      new CapDefaultSubscriptionCycleAdjuster(35188),
      new TieredDefaultSubscriptionCycleAdjuster([1211, 3622, 6623, 7988], [0.92, 1.04, 0.84, 1.05]),
    ],
    [],
    2.2,
    59149.9,
  );
}
