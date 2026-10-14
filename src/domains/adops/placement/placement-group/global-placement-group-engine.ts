import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalPlacementGroup } from "./global-placement-group.js";

/** One step of the global placement group calculation. */
export interface GlobalPlacementGroupFactor {
  describe(): string;
  adjust(item: GlobalPlacementGroup, value: number): number;
}

export class RoundingGlobalPlacementGroupAdjuster implements GlobalPlacementGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPlacementGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalPlacementGroupAdjuster implements GlobalPlacementGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPlacementGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalPlacementGroupDiscountOffsetAdjuster implements GlobalPlacementGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: GlobalPlacementGroup, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedGlobalPlacementGroupAdjuster implements GlobalPlacementGroupFactor {
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

  adjust(item: GlobalPlacementGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global placement group steps in order and keeps a trace of each. */
export class GlobalPlacementGroupEngine {
  steps: GlobalPlacementGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPlacementGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalPlacementGroup): number {
    let current = item.netLoad();
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

  evaluateAll(items: GlobalPlacementGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalPlacementGroupEngine(flagsValue: flags.Registry): GlobalPlacementGroupEngine {
  return new GlobalPlacementGroupEngine(
    [
      new RoundingGlobalPlacementGroupAdjuster(0.1),
      new CapGlobalPlacementGroupAdjuster(21996),
      new GlobalPlacementGroupDiscountOffsetAdjuster(1.28),
      new FlaggedGlobalPlacementGroupAdjuster(flagsValue, "global-placement-group-lenient", -0.8),
    ],
    [],
    0.6,
    89116.2,
  );
}
