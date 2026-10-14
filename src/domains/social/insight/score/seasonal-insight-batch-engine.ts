import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalInsightBatch } from "./seasonal-insight-batch.js";

/** One step of the seasonal insight batch calculation. */
export interface SeasonalInsightBatchAdjuster {
  describe(): string;
  adjust(item: SeasonalInsightBatch, value: number): number;
}

export class SeasonalInsightBatchPriorityOffsetAdjuster implements SeasonalInsightBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: SeasonalInsightBatch, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapSeasonalInsightBatchAdjuster implements SeasonalInsightBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalInsightBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameSeasonalInsightBatchAdjuster implements SeasonalInsightBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalInsightBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalInsightBatchAdjuster implements SeasonalInsightBatchAdjuster {
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

  adjust(item: SeasonalInsightBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalInsightBatchAdjuster implements SeasonalInsightBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalInsightBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSeasonalInsightBatchAdjuster implements SeasonalInsightBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalInsightBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal insight batch steps in order and keeps a trace of each. */
export class SeasonalInsightBatchEngine {
  steps: SeasonalInsightBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalInsightBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalInsightBatch): number {
    let current = item.weightedValue();
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

  evaluateAll(items: SeasonalInsightBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalInsightBatchEngine(flagsValue: flags.Registry): SeasonalInsightBatchEngine {
  return new SeasonalInsightBatchEngine(
    [
      new SeasonalInsightBatchPriorityOffsetAdjuster(0.11),
      new CapSeasonalInsightBatchAdjuster(48822),
      new NameSeasonalInsightBatchAdjuster(new Map<string, number>([["retail", 1.26]])),
      new FlaggedSeasonalInsightBatchAdjuster(flagsValue, "seasonal-insight-batch-primary", -1.6),
      new MinimumSeasonalInsightBatchAdjuster(26.5),
      new PercentSeasonalInsightBatchAdjuster(-15.9),
    ],
    [],
    3.5,
    88193.4,
  );
}
