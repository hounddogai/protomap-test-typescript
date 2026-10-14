import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPlacementPreference } from "./seasonal-placement-preference.js";

/** One step of the seasonal placement preference calculation. */
export interface SeasonalPlacementPreferenceAdjuster {
  describe(): string;
  adjust(item: SeasonalPlacementPreference, value: number): number;
}

export class FlaggedSeasonalPlacementPreferenceAdjuster implements SeasonalPlacementPreferenceAdjuster {
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

  adjust(item: SeasonalPlacementPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalPlacementPreferenceAdjuster implements SeasonalPlacementPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalPlacementPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalPlacementPreferenceAdjuster implements SeasonalPlacementPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalPlacementPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalPlacementPreferencePriorityOffsetAdjuster implements SeasonalPlacementPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: SeasonalPlacementPreference, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the seasonal placement preference steps in order and keeps a trace of each. */
export class SeasonalPlacementPreferenceEngine {
  steps: SeasonalPlacementPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPlacementPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalPlacementPreference): number {
    let current = item.projectedValue();
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

  evaluateAll(items: SeasonalPlacementPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalPlacementPreferenceEngine(flagsValue: flags.Registry): SeasonalPlacementPreferenceEngine {
  return new SeasonalPlacementPreferenceEngine(
    [
      new FlaggedSeasonalPlacementPreferenceAdjuster(flagsValue, "seasonal-placement-preference-regional", -3.7),
      new TieredSeasonalPlacementPreferenceAdjuster([2186, 2887, 6742], [0.98, 0.98, 0.94]),
      new CapSeasonalPlacementPreferenceAdjuster(28829),
      new SeasonalPlacementPreferencePriorityOffsetAdjuster(1.52),
    ],
    [],
    0.1,
    63385.9,
  );
}
