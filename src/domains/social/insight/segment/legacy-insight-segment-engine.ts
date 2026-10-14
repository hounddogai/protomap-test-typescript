import * as numbers from "../../../../kit/numbers.js";
import { LegacyInsightSegment } from "./legacy-insight-segment.js";

/** One step of the legacy insight segment calculation. */
export interface LegacyInsightSegmentFactor {
  describe(): string;
  adjust(item: LegacyInsightSegment, value: number): number;
}

export class TieredLegacyInsightSegmentAdjuster implements LegacyInsightSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyInsightSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLegacyInsightSegmentAdjuster implements LegacyInsightSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyInsightSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LegacyInsightSegmentWindowDaysOffsetAdjuster implements LegacyInsightSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: LegacyInsightSegment, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class CapLegacyInsightSegmentAdjuster implements LegacyInsightSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyInsightSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyInsightSegmentAdjuster implements LegacyInsightSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyInsightSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleLegacyInsightSegmentAdjuster implements LegacyInsightSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyInsightSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy insight segment steps in order and keeps a trace of each. */
export class LegacyInsightSegmentEngine {
  steps: LegacyInsightSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyInsightSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyInsightSegment): number {
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

  evaluateAll(items: LegacyInsightSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyInsightSegmentEngine(): LegacyInsightSegmentEngine {
  return new LegacyInsightSegmentEngine(
    [
      new TieredLegacyInsightSegmentAdjuster([1318, 3766, 6795], [0.98, 1.17, 1.08]),
      new RoundingLegacyInsightSegmentAdjuster(0.25),
      new LegacyInsightSegmentWindowDaysOffsetAdjuster(0.46),
      new CapLegacyInsightSegmentAdjuster(1723),
      new PercentLegacyInsightSegmentAdjuster(11),
      new LocaleLegacyInsightSegmentAdjuster(new Map<string, number>([["south", 0.74]])),
    ],
    [],
    4.4,
    29220.9,
  );
}
