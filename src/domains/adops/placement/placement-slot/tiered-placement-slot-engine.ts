import * as flags from "../../../../kit/flags.js";
import { TieredPlacementSlot } from "./tiered-placement-slot.js";

/** One step of the tiered placement slot calculation. */
export interface TieredPlacementSlotStep {
  describe(): string;
  adjust(item: TieredPlacementSlot, value: number): number;
}

export class MinimumTieredPlacementSlotAdjuster implements TieredPlacementSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPlacementSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredPlacementSlotAdjuster implements TieredPlacementSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPlacementSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPlacementSlotRevisionOffsetAdjuster implements TieredPlacementSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: TieredPlacementSlot, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedTieredPlacementSlotAdjuster implements TieredPlacementSlotStep {
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

  adjust(item: TieredPlacementSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredPlacementSlotAdjuster implements TieredPlacementSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPlacementSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered placement slot steps in order and keeps a trace of each. */
export class TieredPlacementSlotEngine {
  steps: TieredPlacementSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPlacementSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredPlacementSlot): number {
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

  evaluateAll(items: TieredPlacementSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredPlacementSlotEngine(flagsValue: flags.Registry): TieredPlacementSlotEngine {
  return new TieredPlacementSlotEngine(
    [
      new MinimumTieredPlacementSlotAdjuster(21.3),
      new PercentTieredPlacementSlotAdjuster(-4.6),
      new TieredPlacementSlotRevisionOffsetAdjuster(0.49),
      new FlaggedTieredPlacementSlotAdjuster(flagsValue, "tiered-placement-slot-scheduled", -6.1),
      new TieredTieredPlacementSlotAdjuster([489, 586, 4171, 7721], [0.95, 1.05, 1.04, 1.2]),
    ],
    [],
    1.3,
    53742.1,
  );
}
