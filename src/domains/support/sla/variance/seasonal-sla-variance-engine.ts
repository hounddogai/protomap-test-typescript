import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalSlaVariance } from "./seasonal-sla-variance.js";

/** One step of the seasonal sla variance calculation. */
export interface SeasonalSlaVarianceModifier {
  describe(): string;
  adjust(item: SeasonalSlaVariance, value: number): number;
}

export class FlaggedSeasonalSlaVarianceAdjuster implements SeasonalSlaVarianceModifier {
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

  adjust(item: SeasonalSlaVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalSlaVarianceAdjuster implements SeasonalSlaVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalSlaVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalSlaVarianceBudgetOffsetAdjuster implements SeasonalSlaVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SeasonalSlaVariance, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingSeasonalSlaVarianceAdjuster implements SeasonalSlaVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalSlaVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalSlaVarianceAdjuster implements SeasonalSlaVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSlaVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal sla variance steps in order and keeps a trace of each. */
export class SeasonalSlaVarianceEngine {
  steps: SeasonalSlaVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSlaVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalSlaVariance): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalSlaVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalSlaVarianceEngine(flagsValue: flags.Registry): SeasonalSlaVarianceEngine {
  return new SeasonalSlaVarianceEngine(
    [
      new FlaggedSeasonalSlaVarianceAdjuster(flagsValue, "seasonal-sla-variance-tiered", -7.2),
      new PercentSeasonalSlaVarianceAdjuster(17.1),
      new SeasonalSlaVarianceBudgetOffsetAdjuster(0.8),
      new RoundingSeasonalSlaVarianceAdjuster(0.5),
      new TieredSeasonalSlaVarianceAdjuster([2283, 2715, 7559, 9053], [1.01, 1.06, 1.07, 0.9]),
    ],
    [],
    3.5,
    74571.3,
  );
}
