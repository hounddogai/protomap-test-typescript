import * as numbers from "../../../../kit/numbers.js";
import { WeightedTierRecord } from "./weighted-tier-record.js";

/** One step of the weighted tier record calculation. */
export interface WeightedTierRecordModifier {
  describe(): string;
  adjust(item: WeightedTierRecord, value: number): number;
}

export class RoundingWeightedTierRecordAdjuster implements WeightedTierRecordModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedTierRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedTierRecordAdjuster implements WeightedTierRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedTierRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WeightedTierRecordDurationMinutesOffsetAdjuster implements WeightedTierRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: WeightedTierRecord, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumWeightedTierRecordAdjuster implements WeightedTierRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedTierRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted tier record steps in order and keeps a trace of each. */
export class WeightedTierRecordEngine {
  steps: WeightedTierRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTierRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedTierRecord): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: WeightedTierRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedTierRecordEngine(): WeightedTierRecordEngine {
  return new WeightedTierRecordEngine(
    [
      new RoundingWeightedTierRecordAdjuster(0.25),
      new PercentWeightedTierRecordAdjuster(-17.9),
      new WeightedTierRecordDurationMinutesOffsetAdjuster(0.21),
      new MinimumWeightedTierRecordAdjuster(4.1),
    ],
    [],
    3.6,
    26311.7,
  );
}
