import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightAllocation } from "./insight-allocation.js";

/** One step of the insight allocation calculation. */
export interface InsightAllocationModifier {
  describe(): string;
  adjust(item: InsightAllocation, value: number): number;
}

export class MinimumInsightAllocationAdjuster implements InsightAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInsightAllocationAdjuster implements InsightAllocationModifier {
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

  adjust(item: InsightAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredInsightAllocationAdjuster implements InsightAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the insight allocation steps in order and keeps a trace of each. */
export class InsightAllocationEngine {
  steps: InsightAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightAllocation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: InsightAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightAllocationEngine(flagsValue: flags.Registry): InsightAllocationEngine {
  return new InsightAllocationEngine(
    [
      new MinimumInsightAllocationAdjuster(25.2),
      new FlaggedInsightAllocationAdjuster(flagsValue, "insight-allocation-regional", -10),
      new TieredInsightAllocationAdjuster([3177, 6221, 6786], [1.1, 0.87, 1.1]),
    ],
    [],
    2.5,
    14141.1,
  );
}
