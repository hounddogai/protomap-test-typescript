import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueForecast } from "./queue-forecast.js";

/** One step of the queue forecast calculation. */
export interface QueueForecastStep {
  describe(): string;
  adjust(item: QueueForecast, value: number): number;
}

export class RoundingQueueForecastAdjuster implements QueueForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapQueueForecastAdjuster implements QueueForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedQueueForecastAdjuster implements QueueForecastStep {
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

  adjust(item: QueueForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentQueueForecastAdjuster implements QueueForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredQueueForecastAdjuster implements QueueForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class QueueForecastCostOffsetAdjuster implements QueueForecastStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: QueueForecast, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the queue forecast steps in order and keeps a trace of each. */
export class QueueForecastEngine {
  steps: QueueForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: QueueForecast): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: QueueForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultQueueForecastEngine(flagsValue: flags.Registry): QueueForecastEngine {
  return new QueueForecastEngine(
    [
      new RoundingQueueForecastAdjuster(0.5),
      new CapQueueForecastAdjuster(28154),
      new FlaggedQueueForecastAdjuster(flagsValue, "queue-forecast-default", 7),
      new PercentQueueForecastAdjuster(9.2),
      new TieredQueueForecastAdjuster([2131, 8794], [0.98, 1]),
      new QueueForecastCostOffsetAdjuster(0.02),
    ],
    [],
    1.5,
    54535.1,
  );
}
