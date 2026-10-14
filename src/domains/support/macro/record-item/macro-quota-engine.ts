import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroQuota } from "./macro-quota.js";

/** One step of the macro quota calculation. */
export interface MacroQuotaAdjuster {
  describe(): string;
  adjust(item: MacroQuota, value: number): number;
}

export class MacroQuotaMarginOffsetAdjuster implements MacroQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: MacroQuota, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumMacroQuotaAdjuster implements MacroQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedMacroQuotaAdjuster implements MacroQuotaAdjuster {
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

  adjust(item: MacroQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameMacroQuotaAdjuster implements MacroQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: MacroQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the macro quota steps in order and keeps a trace of each. */
export class MacroQuotaEngine {
  steps: MacroQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MacroQuota): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: MacroQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMacroQuotaEngine(flagsValue: flags.Registry): MacroQuotaEngine {
  return new MacroQuotaEngine(
    [
      new MacroQuotaMarginOffsetAdjuster(1.23),
      new MinimumMacroQuotaAdjuster(37.2),
      new FlaggedMacroQuotaAdjuster(flagsValue, "macro-quota-batched", -8.8),
      new NameMacroQuotaAdjuster(new Map<string, number>([["retail", 0.95], ["south", 1.36]])),
    ],
    [],
    4.7,
    53798.6,
  );
}
