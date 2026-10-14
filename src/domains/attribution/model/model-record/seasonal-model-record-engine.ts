import * as numbers from "../../../../kit/numbers.js";
import { SeasonalModelRecord } from "./seasonal-model-record.js";

/** One step of the seasonal model record calculation. */
export interface SeasonalModelRecordStep {
  describe(): string;
  adjust(item: SeasonalModelRecord, value: number): number;
}

export class CapSeasonalModelRecordAdjuster implements SeasonalModelRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalModelRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalModelRecordAdjuster implements SeasonalModelRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalModelRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SeasonalModelRecordPriorityOffsetAdjuster implements SeasonalModelRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: SeasonalModelRecord, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class MinimumSeasonalModelRecordAdjuster implements SeasonalModelRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalModelRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal model record steps in order and keeps a trace of each. */
export class SeasonalModelRecordEngine {
  steps: SeasonalModelRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalModelRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalModelRecord): number {
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

  evaluateAll(items: SeasonalModelRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalModelRecordEngine(): SeasonalModelRecordEngine {
  return new SeasonalModelRecordEngine(
    [
      new CapSeasonalModelRecordAdjuster(32888),
      new RoundingSeasonalModelRecordAdjuster(0.5),
      new SeasonalModelRecordPriorityOffsetAdjuster(0.83),
      new MinimumSeasonalModelRecordAdjuster(1.1),
    ],
    [],
    1.9,
    56254.5,
  );
}
