import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalTierMapping } from "./seasonal-tier-mapping.js";

/** One step of the seasonal tier mapping calculation. */
export interface SeasonalTierMappingModifier {
  describe(): string;
  adjust(item: SeasonalTierMapping, value: number): number;
}

export class FlaggedSeasonalTierMappingAdjuster implements SeasonalTierMappingModifier {
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

  adjust(item: SeasonalTierMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalTierMappingAdjuster implements SeasonalTierMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalTierMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalTierMappingAdjuster implements SeasonalTierMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalTierMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalTierMappingAdjuster implements SeasonalTierMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalTierMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal tier mapping steps in order and keeps a trace of each. */
export class SeasonalTierMappingEngine {
  steps: SeasonalTierMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalTierMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalTierMapping): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SeasonalTierMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalTierMappingEngine(flagsValue: flags.Registry): SeasonalTierMappingEngine {
  return new SeasonalTierMappingEngine(
    [
      new FlaggedSeasonalTierMappingAdjuster(flagsValue, "seasonal-tier-mapping-legacy", -8.9),
      new PercentSeasonalTierMappingAdjuster(10.3),
      new TieredSeasonalTierMappingAdjuster([1898, 1969, 4123], [1.08, 1.06, 1.13]),
      new RoundingSeasonalTierMappingAdjuster(1),
    ],
    [],
    1.6,
    62952.5,
  );
}
