import * as numbers from "../../../../kit/numbers.js";
import { MacroSummary } from "./macro-summary.js";

/** One step of the macro summary calculation. */
export interface MacroSummaryFactor {
  describe(): string;
  adjust(item: MacroSummary, value: number): number;
}

export class RoundingMacroSummaryAdjuster implements MacroSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MacroSummaryRatioOffsetAdjuster implements MacroSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: MacroSummary, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class PercentMacroSummaryAdjuster implements MacroSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the macro summary steps in order and keeps a trace of each. */
export class MacroSummaryEngine {
  steps: MacroSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MacroSummary): number {
    let current = item.effectiveVolume();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: MacroSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMacroSummaryEngine(): MacroSummaryEngine {
  return new MacroSummaryEngine(
    [
      new RoundingMacroSummaryAdjuster(0.05),
      new MacroSummaryRatioOffsetAdjuster(0.71),
      new PercentMacroSummaryAdjuster(-9.9),
    ],
    [],
    2.5,
    69841.2,
  );
}
