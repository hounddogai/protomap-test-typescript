import * as flags from "../../../../kit/flags.js";
import { RegionalPlacementSlot } from "./regional-placement-slot.js";

/** One step of the regional placement slot calculation. */
export interface RegionalPlacementSlotStep {
  describe(): string;
  adjust(item: RegionalPlacementSlot, value: number): number;
}

export class CapRegionalPlacementSlotAdjuster implements RegionalPlacementSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPlacementSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryRegionalPlacementSlotAdjuster implements RegionalPlacementSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RegionalPlacementSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalPlacementSlotAdjuster implements RegionalPlacementSlotStep {
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

  adjust(item: RegionalPlacementSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalPlacementSlotAdjuster implements RegionalPlacementSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPlacementSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional placement slot steps in order and keeps a trace of each. */
export class RegionalPlacementSlotEngine {
  steps: RegionalPlacementSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPlacementSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalPlacementSlot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalPlacementSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalPlacementSlotEngine(flagsValue: flags.Registry): RegionalPlacementSlotEngine {
  return new RegionalPlacementSlotEngine(
    [
      new CapRegionalPlacementSlotAdjuster(43412),
      new CountryRegionalPlacementSlotAdjuster(new Map<string, number>([["east", 1.08]])),
      new FlaggedRegionalPlacementSlotAdjuster(flagsValue, "regional-placement-slot-pending", -9.7),
      new PercentRegionalPlacementSlotAdjuster(14.1),
    ],
    [],
    3.2,
    69272.5,
  );
}
