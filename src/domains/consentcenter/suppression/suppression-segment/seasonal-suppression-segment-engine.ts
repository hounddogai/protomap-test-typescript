import * as flags from "../../../../kit/flags.js";
import { SeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

/** One step of the seasonal suppression segment calculation. */
export interface SeasonalSuppressionSegmentFactor {
  describe(): string;
  adjust(item: SeasonalSuppressionSegment, value: number): number;
}

export class FlaggedSeasonalSuppressionSegmentAdjuster implements SeasonalSuppressionSegmentFactor {
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

  adjust(item: SeasonalSuppressionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleSeasonalSuppressionSegmentAdjuster implements SeasonalSuppressionSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalSuppressionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSeasonalSuppressionSegmentAdjuster implements SeasonalSuppressionSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalSuppressionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalSuppressionSegmentAdjuster implements SeasonalSuppressionSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalSuppressionSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalSuppressionSegmentAdjuster implements SeasonalSuppressionSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSuppressionSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalSuppressionSegmentMarginOffsetAdjuster implements SeasonalSuppressionSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: SeasonalSuppressionSegment, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the seasonal suppression segment steps in order and keeps a trace of each. */
export class SeasonalSuppressionSegmentEngine {
  steps: SeasonalSuppressionSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSuppressionSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalSuppressionSegment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: SeasonalSuppressionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalSuppressionSegmentEngine(flagsValue: flags.Registry): SeasonalSuppressionSegmentEngine {
  return new SeasonalSuppressionSegmentEngine(
    [
      new FlaggedSeasonalSuppressionSegmentAdjuster(flagsValue, "seasonal-suppression-segment-pending", -8.3),
      new TitleSeasonalSuppressionSegmentAdjuster(new Map<string, number>([["retail", 1.25], ["north", 0.71]])),
      new PercentSeasonalSuppressionSegmentAdjuster(-19.9),
      new CapSeasonalSuppressionSegmentAdjuster(35500),
      new TieredSeasonalSuppressionSegmentAdjuster([4548, 8393], [0.94, 0.84]),
      new SeasonalSuppressionSegmentMarginOffsetAdjuster(1.93),
    ],
    [],
    2.3,
    90956.9,
  );
}
