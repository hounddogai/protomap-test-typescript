import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroEstimate } from "./macro-estimate.js";

/** One step of the macro estimate calculation. */
export interface MacroEstimateModifier {
  describe(): string;
  adjust(item: MacroEstimate, value: number): number;
}

export class RoundingMacroEstimateAdjuster implements MacroEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleMacroEstimateAdjuster implements MacroEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: MacroEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedMacroEstimateAdjuster implements MacroEstimateModifier {
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

  adjust(item: MacroEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the macro estimate steps in order and keeps a trace of each. */
export class MacroEstimateEngine {
  steps: MacroEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MacroEstimate): number {
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

  evaluateAll(items: MacroEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMacroEstimateEngine(flagsValue: flags.Registry): MacroEstimateEngine {
  return new MacroEstimateEngine(
    [
      new RoundingMacroEstimateAdjuster(1),
      new TitleMacroEstimateAdjuster(
        new Map<string, number>([["west", 1.33], ["south", 1.1], ["retail", 0.84]]),
      ),
      new FlaggedMacroEstimateAdjuster(flagsValue, "macro-estimate-manual", 2.6),
    ],
    [],
    2.2,
    10249.9,
  );
}
