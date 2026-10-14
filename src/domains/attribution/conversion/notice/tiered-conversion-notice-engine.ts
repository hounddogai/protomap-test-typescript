import * as numbers from "../../../../kit/numbers.js";
import { TieredConversionNotice } from "./tiered-conversion-notice.js";

/** One step of the tiered conversion notice calculation. */
export interface TieredConversionNoticeStep {
  describe(): string;
  adjust(item: TieredConversionNotice, value: number): number;
}

export class LabelTieredConversionNoticeAdjuster implements TieredConversionNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredConversionNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredConversionNoticeStartsAtOffsetAdjuster implements TieredConversionNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: TieredConversionNotice, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class RoundingTieredConversionNoticeAdjuster implements TieredConversionNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredConversionNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered conversion notice steps in order and keeps a trace of each. */
export class TieredConversionNoticeEngine {
  steps: TieredConversionNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredConversionNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredConversionNotice): number {
    let current = item.netTotal();
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

  evaluateAll(items: TieredConversionNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredConversionNoticeEngine(): TieredConversionNoticeEngine {
  return new TieredConversionNoticeEngine(
    [
      new LabelTieredConversionNoticeAdjuster(new Map<string, number>([["south", 1.01], ["online", 1.28]])),
      new TieredConversionNoticeStartsAtOffsetAdjuster(1.46),
      new RoundingTieredConversionNoticeAdjuster(5),
    ],
    [],
    0.2,
    32699,
  );
}
