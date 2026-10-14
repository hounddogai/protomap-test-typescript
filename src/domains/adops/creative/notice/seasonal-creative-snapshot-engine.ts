import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalCreativeSnapshot } from "./seasonal-creative-snapshot.js";

/** One step of the seasonal creative snapshot calculation. */
export interface SeasonalCreativeSnapshotAdjuster {
  describe(): string;
  adjust(item: SeasonalCreativeSnapshot, value: number): number;
}

export class FlaggedSeasonalCreativeSnapshotAdjuster implements SeasonalCreativeSnapshotAdjuster {
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

  adjust(item: SeasonalCreativeSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalCreativeSnapshotAdjuster implements SeasonalCreativeSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCreativeSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentSeasonalCreativeSnapshotAdjuster implements SeasonalCreativeSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalCreativeSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalCreativeSnapshotExpiresAtOffsetAdjuster implements SeasonalCreativeSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: SeasonalCreativeSnapshot, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class TieredSeasonalCreativeSnapshotAdjuster implements SeasonalCreativeSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalCreativeSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalCreativeSnapshotAdjuster implements SeasonalCreativeSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalCreativeSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal creative snapshot steps in order and keeps a trace of each. */
export class SeasonalCreativeSnapshotEngine {
  steps: SeasonalCreativeSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCreativeSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalCreativeSnapshot): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SeasonalCreativeSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalCreativeSnapshotEngine(flagsValue: flags.Registry): SeasonalCreativeSnapshotEngine {
  return new SeasonalCreativeSnapshotEngine(
    [
      new FlaggedSeasonalCreativeSnapshotAdjuster(flagsValue, "seasonal-creative-snapshot-batched", -9.9),
      new PercentSeasonalCreativeSnapshotAdjuster(-20.9),
      new SegmentSeasonalCreativeSnapshotAdjuster(new Map<string, number>([["online", 1.33]])),
      new SeasonalCreativeSnapshotExpiresAtOffsetAdjuster(0.88),
      new TieredSeasonalCreativeSnapshotAdjuster([2090, 4602, 4939, 7902], [0.91, 1.16, 1.16, 0.84]),
      new RoundingSeasonalCreativeSnapshotAdjuster(0.05),
    ],
    [],
    3.6,
    10718.8,
  );
}
