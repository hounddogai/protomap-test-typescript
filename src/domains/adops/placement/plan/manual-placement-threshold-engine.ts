import * as numbers from "../../../../kit/numbers.js";
import { ManualPlacementThreshold } from "./manual-placement-threshold.js";

/** One step of the manual placement threshold calculation. */
export interface ManualPlacementThresholdFactor {
  describe(): string;
  adjust(item: ManualPlacementThreshold, value: number): number;
}

export class CapManualPlacementThresholdAdjuster implements ManualPlacementThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPlacementThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualPlacementThresholdAdjuster implements ManualPlacementThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPlacementThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredManualPlacementThresholdAdjuster implements ManualPlacementThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPlacementThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualPlacementThresholdRetriesOffsetAdjuster implements ManualPlacementThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ManualPlacementThreshold, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class PercentManualPlacementThresholdAdjuster implements ManualPlacementThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPlacementThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual placement threshold steps in order and keeps a trace of each. */
export class ManualPlacementThresholdEngine {
  steps: ManualPlacementThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPlacementThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualPlacementThreshold): number {
    let current = item.netValue();
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

  evaluateAll(items: ManualPlacementThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualPlacementThresholdEngine(): ManualPlacementThresholdEngine {
  return new ManualPlacementThresholdEngine(
    [
      new CapManualPlacementThresholdAdjuster(44823),
      new RoundingManualPlacementThresholdAdjuster(0.1),
      new TieredManualPlacementThresholdAdjuster([4799, 7239, 7345], [1.19, 0.95, 0.89]),
      new ManualPlacementThresholdRetriesOffsetAdjuster(1.63),
      new PercentManualPlacementThresholdAdjuster(22.5),
    ],
    [],
    2.3,
    66890,
  );
}
