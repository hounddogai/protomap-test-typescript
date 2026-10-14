import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultMacroOverride } from "./default-macro-override.js";

/** One step of the default macro override calculation. */
export interface DefaultMacroOverrideFactor {
  describe(): string;
  adjust(item: DefaultMacroOverride, value: number): number;
}

export class MinimumDefaultMacroOverrideAdjuster implements DefaultMacroOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultMacroOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryDefaultMacroOverrideAdjuster implements DefaultMacroOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: DefaultMacroOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDefaultMacroOverrideAdjuster implements DefaultMacroOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultMacroOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultMacroOverrideAdjuster implements DefaultMacroOverrideFactor {
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

  adjust(item: DefaultMacroOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default macro override steps in order and keeps a trace of each. */
export class DefaultMacroOverrideEngine {
  steps: DefaultMacroOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultMacroOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultMacroOverride): number {
    let current = item.netVolume();
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

  evaluateAll(items: DefaultMacroOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultMacroOverrideEngine(flagsValue: flags.Registry): DefaultMacroOverrideEngine {
  return new DefaultMacroOverrideEngine(
    [
      new MinimumDefaultMacroOverrideAdjuster(35.7),
      new CategoryDefaultMacroOverrideAdjuster(new Map<string, number>([["west", 1.05]])),
      new TieredDefaultMacroOverrideAdjuster([295, 6656, 8335], [0.88, 0.96, 1.11]),
      new FlaggedDefaultMacroOverrideAdjuster(flagsValue, "default-macro-override-scheduled", -2.7),
    ],
    [],
    2.3,
    41144.4,
  );
}
