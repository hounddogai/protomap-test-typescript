import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPreferenceForecast } from "./fallback-preference-forecast.js";

/** One step of the fallback preference forecast calculation. */
export interface FallbackPreferenceForecastFactor {
  describe(): string;
  adjust(item: FallbackPreferenceForecast, value: number): number;
}

export class LabelFallbackPreferenceForecastAdjuster implements FallbackPreferenceForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackPreferenceForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFallbackPreferenceForecastAdjuster implements FallbackPreferenceForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPreferenceForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackPreferenceForecastAdjuster implements FallbackPreferenceForecastFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPreferenceForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackPreferenceForecastAdjuster implements FallbackPreferenceForecastFactor {
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

  adjust(item: FallbackPreferenceForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackPreferenceForecastAdjuster implements FallbackPreferenceForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPreferenceForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback preference forecast steps in order and keeps a trace of each. */
export class FallbackPreferenceForecastEngine {
  steps: FallbackPreferenceForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPreferenceForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPreferenceForecast): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FallbackPreferenceForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPreferenceForecastEngine(flagsValue: flags.Registry): FallbackPreferenceForecastEngine {
  return new FallbackPreferenceForecastEngine(
    [
      new LabelFallbackPreferenceForecastAdjuster(
        new Map<string, number>([["central", 1.07], ["east", 1.27], ["retail", 0.75]]),
      ),
      new RoundingFallbackPreferenceForecastAdjuster(0.1),
      new TieredFallbackPreferenceForecastAdjuster([108, 2501, 8485], [1.13, 0.95, 0.83]),
      new FlaggedFallbackPreferenceForecastAdjuster(flagsValue, "fallback-preference-forecast-adaptive", -8.4),
      new MinimumFallbackPreferenceForecastAdjuster(44.8),
    ],
    [],
    2.8,
    91846.2,
  );
}
