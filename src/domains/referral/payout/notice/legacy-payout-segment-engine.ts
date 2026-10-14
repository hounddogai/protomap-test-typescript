import * as numbers from "../../../../kit/numbers.js";
import { LegacyPayoutSegment } from "./legacy-payout-segment.js";

/** One step of the legacy payout segment calculation. */
export interface LegacyPayoutSegmentModifier {
  describe(): string;
  adjust(item: LegacyPayoutSegment, value: number): number;
}

export class RoundingLegacyPayoutSegmentAdjuster implements LegacyPayoutSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPayoutSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitLegacyPayoutSegmentAdjuster implements LegacyPayoutSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LegacyPayoutSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyPayoutSegmentRetriesOffsetAdjuster implements LegacyPayoutSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: LegacyPayoutSegment, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the legacy payout segment steps in order and keeps a trace of each. */
export class LegacyPayoutSegmentEngine {
  steps: LegacyPayoutSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPayoutSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyPayoutSegment): number {
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

  evaluateAll(items: LegacyPayoutSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyPayoutSegmentEngine(): LegacyPayoutSegmentEngine {
  return new LegacyPayoutSegmentEngine(
    [
      new RoundingLegacyPayoutSegmentAdjuster(0.5),
      new UnitLegacyPayoutSegmentAdjuster(
        new Map<string, number>([["north", 1.1], ["east", 0.8], ["west", 1.24]]),
      ),
      new LegacyPayoutSegmentRetriesOffsetAdjuster(1.35),
    ],
    [],
    4.4,
    56705.8,
  );
}
