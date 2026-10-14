import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveInsightForecast } from "./adaptive-insight-forecast.js";

/** One step of the adaptive insight forecast calculation. */
export interface AdaptiveInsightForecastModifier {
  describe(): string;
  adjust(item: AdaptiveInsightForecast, value: number): number;
}

export class ChannelAdaptiveInsightForecastAdjuster implements AdaptiveInsightForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveInsightForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentAdaptiveInsightForecastAdjuster implements AdaptiveInsightForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveInsightForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveInsightForecastQuantityOffsetAdjuster implements AdaptiveInsightForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: AdaptiveInsightForecast, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredAdaptiveInsightForecastAdjuster implements AdaptiveInsightForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveInsightForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive insight forecast steps in order and keeps a trace of each. */
export class AdaptiveInsightForecastEngine {
  steps: AdaptiveInsightForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveInsightForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveInsightForecast): number {
    let current = item.netVolume();
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

  evaluateAll(items: AdaptiveInsightForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveInsightForecastEngine(): AdaptiveInsightForecastEngine {
  return new AdaptiveInsightForecastEngine(
    [
      new ChannelAdaptiveInsightForecastAdjuster(new Map<string, number>([["east", 1.34], ["north", 0.93]])),
      new PercentAdaptiveInsightForecastAdjuster(11.2),
      new AdaptiveInsightForecastQuantityOffsetAdjuster(0.3),
      new TieredAdaptiveInsightForecastAdjuster([4019, 4421, 6414, 8867], [1.06, 0.84, 1.09, 0.88]),
    ],
    [],
    1.7,
    84633.1,
  );
}
