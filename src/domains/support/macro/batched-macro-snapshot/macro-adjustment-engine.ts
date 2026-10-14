import * as numbers from "../../../../kit/numbers.js";
import { MacroAdjustment } from "./macro-adjustment.js";

/** One step of the macro adjustment calculation. */
export interface MacroAdjustmentFactor {
  describe(): string;
  adjust(item: MacroAdjustment, value: number): number;
}

export class MinimumMacroAdjustmentAdjuster implements MacroAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceMacroAdjustmentAdjuster implements MacroAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: MacroAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MacroAdjustmentMarginOffsetAdjuster implements MacroAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: MacroAdjustment, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class RoundingMacroAdjustmentAdjuster implements MacroAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the macro adjustment steps in order and keeps a trace of each. */
export class MacroAdjustmentEngine {
  steps: MacroAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MacroAdjustment): number {
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

  evaluateAll(items: MacroAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMacroAdjustmentEngine(): MacroAdjustmentEngine {
  return new MacroAdjustmentEngine(
    [
      new MinimumMacroAdjustmentAdjuster(47.4),
      new UtmSourceMacroAdjustmentAdjuster(new Map<string, number>([["central", 0.85]])),
      new MacroAdjustmentMarginOffsetAdjuster(1.17),
      new RoundingMacroAdjustmentAdjuster(0.05),
    ],
    [],
    2.5,
    90924.2,
  );
}
