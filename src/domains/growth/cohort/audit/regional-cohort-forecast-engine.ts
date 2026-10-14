import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalCohortForecast } from "./regional-cohort-forecast.js";

/** One step of the regional cohort forecast calculation. */
export interface RegionalCohortForecastModifier {
  describe(): string;
  adjust(item: RegionalCohortForecast, value: number): number;
}

export class RoundingRegionalCohortForecastAdjuster implements RegionalCohortForecastModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalCohortForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalCohortForecastAdjuster implements RegionalCohortForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalCohortForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleRegionalCohortForecastAdjuster implements RegionalCohortForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalCohortForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalCohortForecastAdjuster implements RegionalCohortForecastModifier {
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

  adjust(item: RegionalCohortForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional cohort forecast steps in order and keeps a trace of each. */
export class RegionalCohortForecastEngine {
  steps: RegionalCohortForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCohortForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalCohortForecast): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RegionalCohortForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalCohortForecastEngine(flagsValue: flags.Registry): RegionalCohortForecastEngine {
  return new RegionalCohortForecastEngine(
    [
      new RoundingRegionalCohortForecastAdjuster(0.5),
      new CapRegionalCohortForecastAdjuster(47050),
      new LocaleRegionalCohortForecastAdjuster(new Map<string, number>([["north", 1.1]])),
      new FlaggedRegionalCohortForecastAdjuster(flagsValue, "regional-cohort-forecast-tiered", -0.9),
    ],
    [],
    0.2,
    8883.5,
  );
}
