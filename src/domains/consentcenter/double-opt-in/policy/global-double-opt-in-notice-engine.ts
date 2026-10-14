import * as numbers from "../../../../kit/numbers.js";
import { GlobalDoubleOptInNotice } from "./global-double-opt-in-notice.js";

/** One step of the global double opt in notice calculation. */
export interface GlobalDoubleOptInNoticeFactor {
  describe(): string;
  adjust(item: GlobalDoubleOptInNotice, value: number): number;
}

export class RoundingGlobalDoubleOptInNoticeAdjuster implements GlobalDoubleOptInNoticeFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalDoubleOptInNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalDoubleOptInNoticeAdjuster implements GlobalDoubleOptInNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalDoubleOptInNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleGlobalDoubleOptInNoticeAdjuster implements GlobalDoubleOptInNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalDoubleOptInNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalDoubleOptInNoticeAdjuster implements GlobalDoubleOptInNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalDoubleOptInNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global double opt in notice steps in order and keeps a trace of each. */
export class GlobalDoubleOptInNoticeEngine {
  steps: GlobalDoubleOptInNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDoubleOptInNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalDoubleOptInNotice): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: GlobalDoubleOptInNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalDoubleOptInNoticeEngine(): GlobalDoubleOptInNoticeEngine {
  return new GlobalDoubleOptInNoticeEngine(
    [
      new RoundingGlobalDoubleOptInNoticeAdjuster(0.5),
      new MinimumGlobalDoubleOptInNoticeAdjuster(38),
      new TitleGlobalDoubleOptInNoticeAdjuster(new Map<string, number>([["east", 1.02], ["west", 1.36]])),
      new PercentGlobalDoubleOptInNoticeAdjuster(-17.8),
    ],
    [],
    4.6,
    81726.5,
  );
}
