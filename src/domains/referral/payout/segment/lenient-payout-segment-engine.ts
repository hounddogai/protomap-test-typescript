import * as numbers from "../../../../kit/numbers.js";
import { LenientPayoutSegment } from "./lenient-payout-segment.js";

/** One step of the lenient payout segment calculation. */
export interface LenientPayoutSegmentAdjuster {
  describe(): string;
  adjust(item: LenientPayoutSegment, value: number): number;
}

export class RoundingLenientPayoutSegmentAdjuster implements LenientPayoutSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPayoutSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitLenientPayoutSegmentAdjuster implements LenientPayoutSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LenientPayoutSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientPayoutSegmentExpiresAtOffsetAdjuster implements LenientPayoutSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: LenientPayoutSegment, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the lenient payout segment steps in order and keeps a trace of each. */
export class LenientPayoutSegmentEngine {
  steps: LenientPayoutSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPayoutSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientPayoutSegment): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LenientPayoutSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientPayoutSegmentEngine(): LenientPayoutSegmentEngine {
  return new LenientPayoutSegmentEngine(
    [
      new RoundingLenientPayoutSegmentAdjuster(0.05),
      new UnitLenientPayoutSegmentAdjuster(new Map<string, number>([["retail", 1.18]])),
      new LenientPayoutSegmentExpiresAtOffsetAdjuster(0.84),
    ],
    [],
    2,
    70070.5,
  );
}
