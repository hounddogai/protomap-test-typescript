import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalSlaPlan } from "./global-sla-plan.js";

/** One step of the global sla plan calculation. */
export interface GlobalSlaPlanStep {
  describe(): string;
  adjust(item: GlobalSlaPlan, value: number): number;
}

export class PercentGlobalSlaPlanAdjuster implements GlobalSlaPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSlaPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalSlaPlanAdjuster implements GlobalSlaPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSlaPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalSlaPlanAdjuster implements GlobalSlaPlanStep {
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

  adjust(item: GlobalSlaPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalSlaPlanWindowDaysOffsetAdjuster implements GlobalSlaPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: GlobalSlaPlan, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the global sla plan steps in order and keeps a trace of each. */
export class GlobalSlaPlanEngine {
  steps: GlobalSlaPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSlaPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalSlaPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: GlobalSlaPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalSlaPlanEngine(flagsValue: flags.Registry): GlobalSlaPlanEngine {
  return new GlobalSlaPlanEngine(
    [
      new PercentGlobalSlaPlanAdjuster(-5.8),
      new TieredGlobalSlaPlanAdjuster([2233, 2759, 4352, 8515], [0.81, 1.16, 0.99, 0.83]),
      new FlaggedGlobalSlaPlanAdjuster(flagsValue, "global-sla-plan-primary", -5.8),
      new GlobalSlaPlanWindowDaysOffsetAdjuster(0.45),
    ],
    [],
    2.3,
    89415.4,
  );
}
