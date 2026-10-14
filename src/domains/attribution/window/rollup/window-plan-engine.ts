import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowPlan } from "./window-plan.js";

/** One step of the window plan calculation. */
export interface WindowPlanModifier {
  describe(): string;
  adjust(item: WindowPlan, value: number): number;
}

export class CapWindowPlanAdjuster implements WindowPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWindowPlanAdjuster implements WindowPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWindowPlanAdjuster implements WindowPlanModifier {
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

  adjust(item: WindowPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window plan steps in order and keeps a trace of each. */
export class WindowPlanEngine {
  steps: WindowPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowPlan): number {
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

  evaluateAll(items: WindowPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowPlanEngine(flagsValue: flags.Registry): WindowPlanEngine {
  return new WindowPlanEngine(
    [
      new CapWindowPlanAdjuster(35381),
      new TieredWindowPlanAdjuster([7357, 7575, 8805, 9308], [0.86, 1.19, 0.95, 1.02]),
      new FlaggedWindowPlanAdjuster(flagsValue, "window-plan-batched", -1.4),
    ],
    [],
    3.5,
    40192.8,
  );
}
