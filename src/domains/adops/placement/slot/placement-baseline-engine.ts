import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PlacementBaseline } from "./placement-baseline.js";

/** One step of the placement baseline calculation. */
export interface PlacementBaselineModifier {
  describe(): string;
  adjust(item: PlacementBaseline, value: number): number;
}

export class RoundingPlacementBaselineAdjuster implements PlacementBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PlacementBaselineRetriesOffsetAdjuster implements PlacementBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PlacementBaseline, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class LabelPlacementBaselineAdjuster implements PlacementBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PlacementBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPlacementBaselineAdjuster implements PlacementBaselineModifier {
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

  adjust(item: PlacementBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement baseline steps in order and keeps a trace of each. */
export class PlacementBaselineEngine {
  steps: PlacementBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementBaseline): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PlacementBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementBaselineEngine(flagsValue: flags.Registry): PlacementBaselineEngine {
  return new PlacementBaselineEngine(
    [
      new RoundingPlacementBaselineAdjuster(1),
      new PlacementBaselineRetriesOffsetAdjuster(1.15),
      new LabelPlacementBaselineAdjuster(new Map<string, number>([["north", 1.29]])),
      new FlaggedPlacementBaselineAdjuster(flagsValue, "placement-baseline-batched", -4.1),
    ],
    [],
    0.4,
    21558.9,
  );
}
