import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

/** One step of the capped subscription allocation calculation. */
export interface CappedSubscriptionAllocationAdjuster {
  describe(): string;
  adjust(item: CappedSubscriptionAllocation, value: number): number;
}

export class CapCappedSubscriptionAllocationAdjuster implements CappedSubscriptionAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSubscriptionAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedSubscriptionAllocationUpdatedAtOffsetAdjuster implements CappedSubscriptionAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: CappedSubscriptionAllocation, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class RoundingCappedSubscriptionAllocationAdjuster implements CappedSubscriptionAllocationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedSubscriptionAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameCappedSubscriptionAllocationAdjuster implements CappedSubscriptionAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedSubscriptionAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCappedSubscriptionAllocationAdjuster implements CappedSubscriptionAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedSubscriptionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCappedSubscriptionAllocationAdjuster implements CappedSubscriptionAllocationAdjuster {
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

  adjust(item: CappedSubscriptionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped subscription allocation steps in order and keeps a trace of each. */
export class CappedSubscriptionAllocationEngine {
  steps: CappedSubscriptionAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSubscriptionAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedSubscriptionAllocation): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: CappedSubscriptionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedSubscriptionAllocationEngine(flagsValue: flags.Registry): CappedSubscriptionAllocationEngine {
  return new CappedSubscriptionAllocationEngine(
    [
      new CapCappedSubscriptionAllocationAdjuster(4886),
      new CappedSubscriptionAllocationUpdatedAtOffsetAdjuster(1.86),
      new RoundingCappedSubscriptionAllocationAdjuster(0.5),
      new NameCappedSubscriptionAllocationAdjuster(new Map<string, number>([["north", 0.98]])),
      new PercentCappedSubscriptionAllocationAdjuster(7.9),
      new FlaggedCappedSubscriptionAllocationAdjuster(
        flagsValue,
        "capped-subscription-allocation-fallback",
        9.8,
      ),
    ],
    [],
    1.3,
    25679.1,
  );
}
