import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PlacementAdjustment } from "./placement-adjustment.js";

/** One step of the placement adjustment calculation. */
export interface PlacementAdjustmentFactor {
  describe(): string;
  adjust(item: PlacementAdjustment, value: number): number;
}

export class PlacementAdjustmentRateOffsetAdjuster implements PlacementAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PlacementAdjustment, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class LabelPlacementAdjustmentAdjuster implements PlacementAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PlacementAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPlacementAdjustmentAdjuster implements PlacementAdjustmentFactor {
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

  adjust(item: PlacementAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPlacementAdjustmentAdjuster implements PlacementAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPlacementAdjustmentAdjuster implements PlacementAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement adjustment steps in order and keeps a trace of each. */
export class PlacementAdjustmentEngine {
  steps: PlacementAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementAdjustment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PlacementAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementAdjustmentEngine(flagsValue: flags.Registry): PlacementAdjustmentEngine {
  return new PlacementAdjustmentEngine(
    [
      new PlacementAdjustmentRateOffsetAdjuster(1.47),
      new LabelPlacementAdjustmentAdjuster(
        new Map<string, number>([["south", 1.02], ["retail", 0.81], ["central", 0.75]]),
      ),
      new FlaggedPlacementAdjustmentAdjuster(flagsValue, "placement-adjustment-capped", 3.7),
      new CapPlacementAdjustmentAdjuster(45579),
      new PercentPlacementAdjustmentAdjuster(2.2),
    ],
    [],
    1.9,
    47972.2,
  );
}
