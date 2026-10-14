import * as numbers from "../../../../kit/numbers.js";
import { WaitNotice } from "./wait-notice.js";

/** One step of the wait notice calculation. */
export interface WaitNoticeFactor {
  describe(): string;
  adjust(item: WaitNotice, value: number): number;
}

export class WaitNoticePriorityOffsetAdjuster implements WaitNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: WaitNotice, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class PercentWaitNoticeAdjuster implements WaitNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryWaitNoticeAdjuster implements WaitNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WaitNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the wait notice steps in order and keeps a trace of each. */
export class WaitNoticeEngine {
  steps: WaitNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitNotice): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: WaitNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitNoticeEngine(): WaitNoticeEngine {
  return new WaitNoticeEngine(
    [
      new WaitNoticePriorityOffsetAdjuster(1.41),
      new PercentWaitNoticeAdjuster(-17.2),
      new CategoryWaitNoticeAdjuster(new Map<string, number>([["north", 0.9]])),
    ],
    [],
    0.6,
    63699.4,
  );
}
