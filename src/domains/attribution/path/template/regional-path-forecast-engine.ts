import * as numbers from "../../../../kit/numbers.js";
import { RegionalPathForecast } from "./regional-path-forecast.js";

/** One step of the regional path forecast calculation. */
export interface RegionalPathForecastModifier {
  describe(): string;
  adjust(item: RegionalPathForecast, value: number): number;
}

export class RoundingRegionalPathForecastAdjuster implements RegionalPathForecastModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPathForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalPathForecastAdjuster implements RegionalPathForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPathForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalPathForecastAdjuster implements RegionalPathForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPathForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional path forecast steps in order and keeps a trace of each. */
export class RegionalPathForecastEngine {
  steps: RegionalPathForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPathForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPathForecast): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: RegionalPathForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPathForecastEngine(): RegionalPathForecastEngine {
  return new RegionalPathForecastEngine(
    [
      new RoundingRegionalPathForecastAdjuster(0.25),
      new PercentRegionalPathForecastAdjuster(-7.1),
      new CapRegionalPathForecastAdjuster(11597),
    ],
    [],
    0.3,
    93776.3,
  );
}
