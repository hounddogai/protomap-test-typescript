import * as numbers from "../../../../kit/numbers.js";
import { GlobalExitRuleNotice } from "./global-exit-rule-notice.js";

/** One step of the global exit rule notice calculation. */
export interface GlobalExitRuleNoticeModifier {
  describe(): string;
  adjust(item: GlobalExitRuleNotice, value: number): number;
}

export class RoundingGlobalExitRuleNoticeAdjuster implements GlobalExitRuleNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalExitRuleNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalExitRuleNoticeAmountOffsetAdjuster implements GlobalExitRuleNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: GlobalExitRuleNotice, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumGlobalExitRuleNoticeAdjuster implements GlobalExitRuleNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalExitRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global exit rule notice steps in order and keeps a trace of each. */
export class GlobalExitRuleNoticeEngine {
  steps: GlobalExitRuleNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalExitRuleNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalExitRuleNotice): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: GlobalExitRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalExitRuleNoticeEngine(): GlobalExitRuleNoticeEngine {
  return new GlobalExitRuleNoticeEngine(
    [
      new RoundingGlobalExitRuleNoticeAdjuster(5),
      new GlobalExitRuleNoticeAmountOffsetAdjuster(1.81),
      new MinimumGlobalExitRuleNoticeAdjuster(22.9),
    ],
    [],
    0.6,
    21930.4,
  );
}
