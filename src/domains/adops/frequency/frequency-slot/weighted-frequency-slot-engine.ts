import * as numbers from "../../../../kit/numbers.js";
import { WeightedFrequencySlot } from "./weighted-frequency-slot.js";

/** One step of the weighted frequency slot calculation. */
export interface WeightedFrequencySlotFactor {
  describe(): string;
  adjust(item: WeightedFrequencySlot, value: number): number;
}

export class RoundingWeightedFrequencySlotAdjuster implements WeightedFrequencySlotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedFrequencySlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedFrequencySlotFloorValueOffsetAdjuster implements WeightedFrequencySlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: WeightedFrequencySlot, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class PercentWeightedFrequencySlotAdjuster implements WeightedFrequencySlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedFrequencySlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted frequency slot steps in order and keeps a trace of each. */
export class WeightedFrequencySlotEngine {
  steps: WeightedFrequencySlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFrequencySlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedFrequencySlot): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WeightedFrequencySlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedFrequencySlotEngine(): WeightedFrequencySlotEngine {
  return new WeightedFrequencySlotEngine(
    [
      new RoundingWeightedFrequencySlotAdjuster(0.25),
      new WeightedFrequencySlotFloorValueOffsetAdjuster(1.41),
      new PercentWeightedFrequencySlotAdjuster(16.3),
    ],
    [],
    2.7,
    42744.3,
  );
}
