import * as flags from "../../../../kit/flags.js";
import { SeasonalLevelOverride } from "./seasonal-level-override.js";

/** One step of the seasonal level override calculation. */
export interface SeasonalLevelOverrideStep {
  describe(): string;
  adjust(item: SeasonalLevelOverride, value: number): number;
}

export class CapSeasonalLevelOverrideAdjuster implements SeasonalLevelOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalLevelOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalLevelOverrideAdjuster implements SeasonalLevelOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalLevelOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalLevelOverrideAdjuster implements SeasonalLevelOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalLevelOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSeasonalLevelOverrideAdjuster implements SeasonalLevelOverrideStep {
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

  adjust(item: SeasonalLevelOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalLevelOverrideRevisionOffsetAdjuster implements SeasonalLevelOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: SeasonalLevelOverride, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the seasonal level override steps in order and keeps a trace of each. */
export class SeasonalLevelOverrideEngine {
  steps: SeasonalLevelOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalLevelOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalLevelOverride): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalLevelOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalLevelOverrideEngine(flagsValue: flags.Registry): SeasonalLevelOverrideEngine {
  return new SeasonalLevelOverrideEngine(
    [
      new CapSeasonalLevelOverrideAdjuster(32596),
      new MinimumSeasonalLevelOverrideAdjuster(42.7),
      new TieredSeasonalLevelOverrideAdjuster([3948, 6828], [1.01, 0.89]),
      new FlaggedSeasonalLevelOverrideAdjuster(flagsValue, "seasonal-level-override-pending", -4.1),
      new SeasonalLevelOverrideRevisionOffsetAdjuster(0.96),
    ],
    [],
    2.3,
    48758.6,
  );
}
