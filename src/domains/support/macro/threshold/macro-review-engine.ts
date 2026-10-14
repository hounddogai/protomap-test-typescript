import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroReview } from "./macro-review.js";

/** One step of the macro review calculation. */
export interface MacroReviewModifier {
  describe(): string;
  adjust(item: MacroReview, value: number): number;
}

export class RoundingMacroReviewAdjuster implements MacroReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedMacroReviewAdjuster implements MacroReviewModifier {
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

  adjust(item: MacroReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredMacroReviewAdjuster implements MacroReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMacroReviewAdjuster implements MacroReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the macro review steps in order and keeps a trace of each. */
export class MacroReviewEngine {
  steps: MacroReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroReview): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: MacroReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroReviewEngine(flagsValue: flags.Registry): MacroReviewEngine {
  return new MacroReviewEngine(
    [
      new RoundingMacroReviewAdjuster(0.05),
      new FlaggedMacroReviewAdjuster(flagsValue, "macro-review-primary", 1.7),
      new TieredMacroReviewAdjuster([2241, 5243, 5538, 8501], [0.97, 1.12, 0.96, 0.92]),
      new MinimumMacroReviewAdjuster(43.6),
    ],
    [],
    3.9,
    80754.1,
  );
}
