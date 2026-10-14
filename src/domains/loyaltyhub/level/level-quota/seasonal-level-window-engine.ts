import * as flags from "../../../../kit/flags.js";
import { SeasonalLevelWindow } from "./seasonal-level-window.js";

/** One step of the seasonal level window calculation. */
export interface SeasonalLevelWindowStep {
  describe(): string;
  adjust(item: SeasonalLevelWindow, value: number): number;
}

export class CapSeasonalLevelWindowAdjuster implements SeasonalLevelWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalLevelWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalLevelWindowMaximumOffsetAdjuster implements SeasonalLevelWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: SeasonalLevelWindow, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class FlaggedSeasonalLevelWindowAdjuster implements SeasonalLevelWindowStep {
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

  adjust(item: SeasonalLevelWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalLevelWindowAdjuster implements SeasonalLevelWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalLevelWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal level window steps in order and keeps a trace of each. */
export class SeasonalLevelWindowEngine {
  steps: SeasonalLevelWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalLevelWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalLevelWindow): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SeasonalLevelWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalLevelWindowEngine(flagsValue: flags.Registry): SeasonalLevelWindowEngine {
  return new SeasonalLevelWindowEngine(
    [
      new CapSeasonalLevelWindowAdjuster(19510),
      new SeasonalLevelWindowMaximumOffsetAdjuster(1.44),
      new FlaggedSeasonalLevelWindowAdjuster(flagsValue, "seasonal-level-window-weighted", -1.3),
      new TieredSeasonalLevelWindowAdjuster([6023, 8834], [1.05, 0.93]),
    ],
    [],
    2.2,
    3905.3,
  );
}
