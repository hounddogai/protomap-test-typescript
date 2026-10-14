import * as flags from "../../../../kit/flags.js";
import { PlacementCycle } from "./placement-cycle.js";

/** One step of the placement cycle calculation. */
export interface PlacementCycleStep {
  describe(): string;
  adjust(item: PlacementCycle, value: number): number;
}

export class TieredPlacementCycleAdjuster implements PlacementCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PlacementCycleBidOffsetAdjuster implements PlacementCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PlacementCycle, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapPlacementCycleAdjuster implements PlacementCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPlacementCycleAdjuster implements PlacementCycleStep {
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

  adjust(item: PlacementCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement cycle steps in order and keeps a trace of each. */
export class PlacementCycleEngine {
  steps: PlacementCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PlacementCycle): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PlacementCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPlacementCycleEngine(flagsValue: flags.Registry): PlacementCycleEngine {
  return new PlacementCycleEngine(
    [
      new TieredPlacementCycleAdjuster([536, 2628, 3009, 5236], [1.19, 1.18, 1.15, 1.17]),
      new PlacementCycleBidOffsetAdjuster(1.95),
      new CapPlacementCycleAdjuster(7168),
      new FlaggedPlacementCycleAdjuster(flagsValue, "placement-cycle-rolling", -7.1),
    ],
    [],
    4.3,
    19782,
  );
}
