import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderPlan } from "./sender-plan.js";

/** One step of the sender plan calculation. */
export interface SenderPlanFactor {
  describe(): string;
  adjust(item: SenderPlan, value: number): number;
}

export class MinimumSenderPlanAdjuster implements SenderPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSenderPlanAdjuster implements SenderPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSenderPlanAdjuster implements SenderPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSenderPlanAdjuster implements SenderPlanFactor {
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

  adjust(item: SenderPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sender plan steps in order and keeps a trace of each. */
export class SenderPlanEngine {
  steps: SenderPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderPlan): number {
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

  evaluateAll(items: SenderPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderPlanEngine(flagsValue: flags.Registry): SenderPlanEngine {
  return new SenderPlanEngine(
    [
      new MinimumSenderPlanAdjuster(3.6),
      new CapSenderPlanAdjuster(11800),
      new TieredSenderPlanAdjuster([190, 409, 542, 9512], [1.1, 0.8, 1.08, 1.05]),
      new FlaggedSenderPlanAdjuster(flagsValue, "sender-plan-seasonal", 0.9),
    ],
    [],
    2.1,
    58532.7,
  );
}
