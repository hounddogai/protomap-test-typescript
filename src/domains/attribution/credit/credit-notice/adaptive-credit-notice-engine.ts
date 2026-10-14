import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCreditNotice } from "./adaptive-credit-notice.js";

/** One step of the adaptive credit notice calculation. */
export interface AdaptiveCreditNoticeModifier {
  describe(): string;
  adjust(item: AdaptiveCreditNotice, value: number): number;
}

export class SourceAdaptiveCreditNoticeAdjuster implements AdaptiveCreditNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: AdaptiveCreditNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentAdaptiveCreditNoticeAdjuster implements AdaptiveCreditNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveCreditNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveCreditNoticeAdjuster implements AdaptiveCreditNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveCreditNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive credit notice steps in order and keeps a trace of each. */
export class AdaptiveCreditNoticeEngine {
  steps: AdaptiveCreditNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCreditNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveCreditNotice): number {
    let current = item.netExposure();
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

  evaluateAll(items: AdaptiveCreditNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveCreditNoticeEngine(): AdaptiveCreditNoticeEngine {
  return new AdaptiveCreditNoticeEngine(
    [
      new SourceAdaptiveCreditNoticeAdjuster(new Map<string, number>([["central", 1.07]])),
      new PercentAdaptiveCreditNoticeAdjuster(18.7),
      new RoundingAdaptiveCreditNoticeAdjuster(0.1),
    ],
    [],
    3.2,
    3691.5,
  );
}
