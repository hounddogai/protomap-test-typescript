import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedChallengeSlot } from "./weighted-challenge-slot.js";

/** One step of the weighted challenge slot calculation. */
export interface WeightedChallengeSlotStep {
  describe(): string;
  adjust(item: WeightedChallengeSlot, value: number): number;
}

export class RoundingWeightedChallengeSlotAdjuster implements WeightedChallengeSlotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedChallengeSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedChallengeSlotAdjuster implements WeightedChallengeSlotStep {
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

  adjust(item: WeightedChallengeSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedChallengeSlotBatchSizeOffsetAdjuster implements WeightedChallengeSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: WeightedChallengeSlot, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentWeightedChallengeSlotAdjuster implements WeightedChallengeSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedChallengeSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedChallengeSlotAdjuster implements WeightedChallengeSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedChallengeSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted challenge slot steps in order and keeps a trace of each. */
export class WeightedChallengeSlotEngine {
  steps: WeightedChallengeSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedChallengeSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedChallengeSlot): number {
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

  evaluateAll(items: WeightedChallengeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedChallengeSlotEngine(flagsValue: flags.Registry): WeightedChallengeSlotEngine {
  return new WeightedChallengeSlotEngine(
    [
      new RoundingWeightedChallengeSlotAdjuster(0.1),
      new FlaggedWeightedChallengeSlotAdjuster(flagsValue, "weighted-challenge-slot-capped", -5.4),
      new WeightedChallengeSlotBatchSizeOffsetAdjuster(1.81),
      new PercentWeightedChallengeSlotAdjuster(16.9),
      new TieredWeightedChallengeSlotAdjuster([3628, 3984, 6767, 8954], [0.96, 0.93, 1.16, 1.01]),
    ],
    [],
    1,
    83485.5,
  );
}
