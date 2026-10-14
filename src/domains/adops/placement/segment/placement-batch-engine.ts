import * as flags from "../../../../kit/flags.js";
import { PlacementBatch } from "./placement-batch.js";

/** One step of the placement batch calculation. */
export interface PlacementBatchModifier {
  describe(): string;
  adjust(item: PlacementBatch, value: number): number;
}

export class PercentPlacementBatchAdjuster implements PlacementBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPlacementBatchAdjuster implements PlacementBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPlacementBatchAdjuster implements PlacementBatchModifier {
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

  adjust(item: PlacementBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement batch steps in order and keeps a trace of each. */
export class PlacementBatchEngine {
  steps: PlacementBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PlacementBatch): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PlacementBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPlacementBatchEngine(flagsValue: flags.Registry): PlacementBatchEngine {
  return new PlacementBatchEngine(
    [
      new PercentPlacementBatchAdjuster(12.1),
      new TieredPlacementBatchAdjuster([965, 2831, 3481, 8218], [0.81, 0.98, 1.03, 0.82]),
      new FlaggedPlacementBatchAdjuster(flagsValue, "placement-batch-legacy", -4.9),
    ],
    [],
    2.9,
    75809.6,
  );
}
