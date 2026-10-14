import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDomainVariance } from "./seasonal-domain-variance.js";

/** One step of the seasonal domain variance calculation. */
export interface SeasonalDomainVarianceModifier {
  describe(): string;
  adjust(item: SeasonalDomainVariance, value: number): number;
}

export class RoundingSeasonalDomainVarianceAdjuster implements SeasonalDomainVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalDomainVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalDomainVarianceAdjuster implements SeasonalDomainVarianceModifier {
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

  adjust(item: SeasonalDomainVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionSeasonalDomainVarianceAdjuster implements SeasonalDomainVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: SeasonalDomainVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSeasonalDomainVarianceAdjuster implements SeasonalDomainVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalDomainVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal domain variance steps in order and keeps a trace of each. */
export class SeasonalDomainVarianceEngine {
  steps: SeasonalDomainVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDomainVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalDomainVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalDomainVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalDomainVarianceEngine(flagsValue: flags.Registry): SeasonalDomainVarianceEngine {
  return new SeasonalDomainVarianceEngine(
    [
      new RoundingSeasonalDomainVarianceAdjuster(0.05),
      new FlaggedSeasonalDomainVarianceAdjuster(flagsValue, "seasonal-domain-variance-regional", -4),
      new RegionSeasonalDomainVarianceAdjuster(
        new Map<string, number>([["west", 0.96], ["online", 0.92], ["central", 1]]),
      ),
      new PercentSeasonalDomainVarianceAdjuster(10.6),
    ],
    [],
    3.5,
    59547.7,
  );
}
