import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TouchpointForecast } from "./touchpoint-forecast.js";

/** One step of the touchpoint forecast calculation. */
export interface TouchpointForecastStep {
  describe(): string;
  adjust(item: TouchpointForecast, value: number): number;
}

export class TouchpointForecastThresholdOffsetAdjuster implements TouchpointForecastStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: TouchpointForecast, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapTouchpointForecastAdjuster implements TouchpointForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTouchpointForecastAdjuster implements TouchpointForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTouchpointForecastAdjuster implements TouchpointForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTouchpointForecastAdjuster implements TouchpointForecastStep {
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

  adjust(item: TouchpointForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelTouchpointForecastAdjuster implements TouchpointForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TouchpointForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the touchpoint forecast steps in order and keeps a trace of each. */
export class TouchpointForecastEngine {
  steps: TouchpointForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TouchpointForecast): number {
    let current = item.weightedValue();
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

  evaluateAll(items: TouchpointForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTouchpointForecastEngine(flagsValue: flags.Registry): TouchpointForecastEngine {
  return new TouchpointForecastEngine(
    [
      new TouchpointForecastThresholdOffsetAdjuster(0.75),
      new CapTouchpointForecastAdjuster(49310),
      new MinimumTouchpointForecastAdjuster(44.7),
      new RoundingTouchpointForecastAdjuster(1),
      new FlaggedTouchpointForecastAdjuster(flagsValue, "touchpoint-forecast-capped", -1.3),
      new ChannelTouchpointForecastAdjuster(new Map<string, number>([["east", 0.93]])),
    ],
    [],
    1.2,
    25316.9,
  );
}
