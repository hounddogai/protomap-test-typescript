import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionForecast } from "./conversion-forecast.js";

/** One step of the conversion forecast calculation. */
export interface ConversionForecastAdjuster {
  describe(): string;
  adjust(item: ConversionForecast, value: number): number;
}

export class ConversionForecastEndsAtOffsetAdjuster implements ConversionForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ConversionForecast, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class CapConversionForecastAdjuster implements ConversionForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedConversionForecastAdjuster implements ConversionForecastAdjuster {
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

  adjust(item: ConversionForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceConversionForecastAdjuster implements ConversionForecastAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ConversionForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingConversionForecastAdjuster implements ConversionForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the conversion forecast steps in order and keeps a trace of each. */
export class ConversionForecastEngine {
  steps: ConversionForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionForecast): number {
    let current = item.netValue();
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

  evaluateAll(items: ConversionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionForecastEngine(flagsValue: flags.Registry): ConversionForecastEngine {
  return new ConversionForecastEngine(
    [
      new ConversionForecastEndsAtOffsetAdjuster(1.51),
      new CapConversionForecastAdjuster(42130),
      new FlaggedConversionForecastAdjuster(flagsValue, "conversion-forecast-weighted", -6.7),
      new SourceConversionForecastAdjuster(
        new Map<string, number>([["online", 1.26], ["north", 0.71], ["west", 1.35]]),
      ),
      new RoundingConversionForecastAdjuster(0.05),
    ],
    [],
    0.4,
    78607.1,
  );
}
