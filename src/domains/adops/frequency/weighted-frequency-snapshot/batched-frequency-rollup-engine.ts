import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFrequencyRollup } from "./batched-frequency-rollup.js";

/** One step of the batched frequency rollup calculation. */
export interface BatchedFrequencyRollupModifier {
  describe(): string;
  adjust(item: BatchedFrequencyRollup, value: number): number;
}

export class FlaggedBatchedFrequencyRollupAdjuster implements BatchedFrequencyRollupModifier {
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

  adjust(item: BatchedFrequencyRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedFrequencyRollupAdjuster implements BatchedFrequencyRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFrequencyRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedFrequencyRollupAdjuster implements BatchedFrequencyRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedFrequencyRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched frequency rollup steps in order and keeps a trace of each. */
export class BatchedFrequencyRollupEngine {
  steps: BatchedFrequencyRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFrequencyRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedFrequencyRollup): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: BatchedFrequencyRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedFrequencyRollupEngine(flagsValue: flags.Registry): BatchedFrequencyRollupEngine {
  return new BatchedFrequencyRollupEngine(
    [
      new FlaggedBatchedFrequencyRollupAdjuster(flagsValue, "batched-frequency-rollup-legacy", 4.1),
      new RoundingBatchedFrequencyRollupAdjuster(0.25),
      new TieredBatchedFrequencyRollupAdjuster([3886, 4720, 5570], [1.16, 0.93, 0.8]),
    ],
    [],
    2.6,
    30540.2,
  );
}
