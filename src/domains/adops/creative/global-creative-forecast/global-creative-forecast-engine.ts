import * as flags from "../../../../kit/flags.js";
import { GlobalCreativeForecast } from "./global-creative-forecast.js";

/** One step of the global creative forecast calculation. */
export interface GlobalCreativeForecastModifier {
  describe(): string;
  adjust(item: GlobalCreativeForecast, value: number): number;
}

export class FlaggedGlobalCreativeForecastAdjuster implements GlobalCreativeForecastModifier {
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

  adjust(item: GlobalCreativeForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalCreativeForecastAdjuster implements GlobalCreativeForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCreativeForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalCreativeForecastAdjuster implements GlobalCreativeForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCreativeForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalCreativeForecastAdjuster implements GlobalCreativeForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalCreativeForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global creative forecast steps in order and keeps a trace of each. */
export class GlobalCreativeForecastEngine {
  steps: GlobalCreativeForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCreativeForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalCreativeForecast): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: GlobalCreativeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalCreativeForecastEngine(flagsValue: flags.Registry): GlobalCreativeForecastEngine {
  return new GlobalCreativeForecastEngine(
    [
      new FlaggedGlobalCreativeForecastAdjuster(flagsValue, "global-creative-forecast-batched", 0.1),
      new PercentGlobalCreativeForecastAdjuster(-14.7),
      new MinimumGlobalCreativeForecastAdjuster(9.2),
      new CapGlobalCreativeForecastAdjuster(8177),
    ],
    [],
    4.3,
    96635,
  );
}
