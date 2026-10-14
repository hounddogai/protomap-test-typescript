import * as numbers from "../../../../kit/numbers.js";
import { TieredPlacementRecord } from "./tiered-placement-record.js";

/** One step of the tiered placement record calculation. */
export interface TieredPlacementRecordFactor {
  describe(): string;
  adjust(item: TieredPlacementRecord, value: number): number;
}

export class NameTieredPlacementRecordAdjuster implements TieredPlacementRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredPlacementRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredPlacementRecordAdjuster implements TieredPlacementRecordFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPlacementRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredPlacementRecordAdjuster implements TieredPlacementRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPlacementRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredPlacementRecordAdjuster implements TieredPlacementRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPlacementRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered placement record steps in order and keeps a trace of each. */
export class TieredPlacementRecordEngine {
  steps: TieredPlacementRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPlacementRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredPlacementRecord): number {
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

  evaluateAll(items: TieredPlacementRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredPlacementRecordEngine(): TieredPlacementRecordEngine {
  return new TieredPlacementRecordEngine(
    [
      new NameTieredPlacementRecordAdjuster(
        new Map<string, number>([["retail", 1.15], ["east", 1.35], ["west", 1.39]]),
      ),
      new CapTieredPlacementRecordAdjuster(22729),
      new PercentTieredPlacementRecordAdjuster(-11),
      new RoundingTieredPlacementRecordAdjuster(0.05),
    ],
    [],
    1.6,
    39659.9,
  );
}
