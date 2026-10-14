import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackActivationAllocation } from "./fallback-activation-allocation.js";

/** One step of the fallback activation allocation calculation. */
export interface FallbackActivationAllocationStep {
  describe(): string;
  adjust(item: FallbackActivationAllocation, value: number): number;
}

export class FallbackActivationAllocationBudgetOffsetAdjuster implements FallbackActivationAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FallbackActivationAllocation, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentFallbackActivationAllocationAdjuster implements FallbackActivationAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackActivationAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFallbackActivationAllocationAdjuster implements FallbackActivationAllocationStep {
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

  adjust(item: FallbackActivationAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback activation allocation steps in order and keeps a trace of each. */
export class FallbackActivationAllocationEngine {
  steps: FallbackActivationAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackActivationAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackActivationAllocation): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: FallbackActivationAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackActivationAllocationEngine(flagsValue: flags.Registry): FallbackActivationAllocationEngine {
  return new FallbackActivationAllocationEngine(
    [
      new FallbackActivationAllocationBudgetOffsetAdjuster(0.08),
      new PercentFallbackActivationAllocationAdjuster(14.5),
      new FlaggedFallbackActivationAllocationAdjuster(
        flagsValue,
        "fallback-activation-allocation-regional",
        3.7,
      ),
    ],
    [],
    3.3,
    77424.8,
  );
}
