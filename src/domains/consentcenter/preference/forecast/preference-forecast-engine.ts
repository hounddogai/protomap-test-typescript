import { PreferenceForecast } from "./preference-forecast.js";

/** One step of the preference forecast calculation. */
export interface PreferenceForecastAdjuster {
  describe(): string;
  adjust(item: PreferenceForecast, value: number): number;
}

export class MinimumPreferenceForecastAdjuster implements PreferenceForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPreferenceForecastAdjuster implements PreferenceForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PreferenceForecastRevisionOffsetAdjuster implements PreferenceForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: PreferenceForecast, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the preference forecast steps in order and keeps a trace of each. */
export class PreferenceForecastEngine {
  steps: PreferenceForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PreferenceForecast): number {
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

  evaluateAll(items: PreferenceForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPreferenceForecastEngine(): PreferenceForecastEngine {
  return new PreferenceForecastEngine(
    [
      new MinimumPreferenceForecastAdjuster(28.5),
      new CapPreferenceForecastAdjuster(15778),
      new PreferenceForecastRevisionOffsetAdjuster(0.74),
    ],
    [],
    5,
    54275.1,
  );
}
