import * as numbers from "../../../../kit/numbers.js";
import { LegacyNudgeForecast } from "./legacy-nudge-forecast.js";

/** One step of the legacy nudge forecast calculation. */
export interface LegacyNudgeForecastStep {
  describe(): string;
  adjust(item: LegacyNudgeForecast, value: number): number;
}

export class LabelLegacyNudgeForecastAdjuster implements LegacyNudgeForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyNudgeForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyNudgeForecastAdjuster implements LegacyNudgeForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyNudgeForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacyNudgeForecastAdjuster implements LegacyNudgeForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyNudgeForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyNudgeForecastAdjuster implements LegacyNudgeForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyNudgeForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyNudgeForecastAdjuster implements LegacyNudgeForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyNudgeForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy nudge forecast steps in order and keeps a trace of each. */
export class LegacyNudgeForecastEngine {
  steps: LegacyNudgeForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyNudgeForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyNudgeForecast): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: LegacyNudgeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyNudgeForecastEngine(): LegacyNudgeForecastEngine {
  return new LegacyNudgeForecastEngine(
    [
      new LabelLegacyNudgeForecastAdjuster(new Map<string, number>([["west", 1.23], ["east", 1.37]])),
      new MinimumLegacyNudgeForecastAdjuster(40.1),
      new PercentLegacyNudgeForecastAdjuster(23.8),
      new RoundingLegacyNudgeForecastAdjuster(0.1),
      new TieredLegacyNudgeForecastAdjuster([721, 7137], [0.94, 0.99]),
    ],
    [],
    0.2,
    23767,
  );
}
