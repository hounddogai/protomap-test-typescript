import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualSlaPlan } from "./manual-sla-plan.js";

/** One step of the manual sla plan calculation. */
export interface ManualSlaPlanFactor {
  describe(): string;
  adjust(item: ManualSlaPlan, value: number): number;
}

export class PercentManualSlaPlanAdjuster implements ManualSlaPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualSlaPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualSlaPlanAdjuster implements ManualSlaPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualSlaPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualSlaPlanAdjuster implements ManualSlaPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualSlaPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedManualSlaPlanAdjuster implements ManualSlaPlanFactor {
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

  adjust(item: ManualSlaPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualSlaPlanImpressionsOffsetAdjuster implements ManualSlaPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: ManualSlaPlan, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the manual sla plan steps in order and keeps a trace of each. */
export class ManualSlaPlanEngine {
  steps: ManualSlaPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualSlaPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualSlaPlan): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ManualSlaPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualSlaPlanEngine(flagsValue: flags.Registry): ManualSlaPlanEngine {
  return new ManualSlaPlanEngine(
    [
      new PercentManualSlaPlanAdjuster(-13.9),
      new MinimumManualSlaPlanAdjuster(2.8),
      new CapManualSlaPlanAdjuster(14554),
      new FlaggedManualSlaPlanAdjuster(flagsValue, "manual-sla-plan-capped", 0.7),
      new ManualSlaPlanImpressionsOffsetAdjuster(1.04),
    ],
    [],
    2.5,
    67711.6,
  );
}
