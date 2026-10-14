import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePayoutNotice } from "./adaptive-payout-notice.js";

/** One step of the adaptive payout notice calculation. */
export interface AdaptivePayoutNoticeFactor {
  describe(): string;
  adjust(item: AdaptivePayoutNotice, value: number): number;
}

export class PercentAdaptivePayoutNoticeAdjuster implements AdaptivePayoutNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePayoutNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelAdaptivePayoutNoticeAdjuster implements AdaptivePayoutNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptivePayoutNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptivePayoutNoticeAdjuster implements AdaptivePayoutNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptivePayoutNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive payout notice steps in order and keeps a trace of each. */
export class AdaptivePayoutNoticeEngine {
  steps: AdaptivePayoutNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePayoutNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptivePayoutNotice): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptivePayoutNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptivePayoutNoticeEngine(): AdaptivePayoutNoticeEngine {
  return new AdaptivePayoutNoticeEngine(
    [
      new PercentAdaptivePayoutNoticeAdjuster(-0.5),
      new LabelAdaptivePayoutNoticeAdjuster(new Map<string, number>([["east", 0.82], ["west", 1.39]])),
      new CapAdaptivePayoutNoticeAdjuster(6164),
    ],
    [],
    1.1,
    53522.1,
  );
}
