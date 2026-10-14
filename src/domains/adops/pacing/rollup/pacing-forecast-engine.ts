import * as flags from "../../../../kit/flags.js";
import { PacingForecast } from "./pacing-forecast.js";

/** One step of the pacing forecast calculation. */
export interface PacingForecastAdjuster {
  describe(): string;
  adjust(item: PacingForecast, value: number): number;
}

export class PercentPacingForecastAdjuster implements PacingForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPacingForecastAdjuster implements PacingForecastAdjuster {
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

  adjust(item: PacingForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPacingForecastAdjuster implements PacingForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PacingForecastFrequencyCapOffsetAdjuster implements PacingForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: PacingForecast, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class MinimumPacingForecastAdjuster implements PacingForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPacingForecastAdjuster implements PacingForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pacing forecast steps in order and keeps a trace of each. */
export class PacingForecastEngine {
  steps: PacingForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PacingForecast): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PacingForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPacingForecastEngine(flagsValue: flags.Registry): PacingForecastEngine {
  return new PacingForecastEngine(
    [
      new PercentPacingForecastAdjuster(-14.1),
      new FlaggedPacingForecastAdjuster(flagsValue, "pacing-forecast-adaptive", 5.4),
      new TieredPacingForecastAdjuster([1533, 8259], [1.14, 1.02]),
      new PacingForecastFrequencyCapOffsetAdjuster(0.03),
      new MinimumPacingForecastAdjuster(48.1),
      new CapPacingForecastAdjuster(37374),
    ],
    [],
    2.9,
    29099.9,
  );
}
