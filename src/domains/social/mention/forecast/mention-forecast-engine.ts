import * as numbers from "../../../../kit/numbers.js";
import { MentionForecast } from "./mention-forecast.js";

/** One step of the mention forecast calculation. */
export interface MentionForecastAdjuster {
  describe(): string;
  adjust(item: MentionForecast, value: number): number;
}

export class PercentMentionForecastAdjuster implements MentionForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameMentionForecastAdjuster implements MentionForecastAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: MentionForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MentionForecastLimitOffsetAdjuster implements MentionForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: MentionForecast, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the mention forecast steps in order and keeps a trace of each. */
export class MentionForecastEngine {
  steps: MentionForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionForecast): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: MentionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionForecastEngine(): MentionForecastEngine {
  return new MentionForecastEngine(
    [
      new PercentMentionForecastAdjuster(0.7),
      new NameMentionForecastAdjuster(
        new Map<string, number>([["south", 1.23], ["west", 1.15], ["north", 1.09]]),
      ),
      new MentionForecastLimitOffsetAdjuster(1.51),
    ],
    [],
    0.9,
    12181,
  );
}
