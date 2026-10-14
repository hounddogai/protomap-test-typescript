import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPostMetric } from "./seasonal-post-metric.js";

/** One step of the seasonal post metric calculation. */
export interface SeasonalPostMetricFactor {
  describe(): string;
  adjust(item: SeasonalPostMetric, value: number): number;
}

export class FlaggedSeasonalPostMetricAdjuster implements SeasonalPostMetricFactor {
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

  adjust(item: SeasonalPostMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalPostMetricAdjuster implements SeasonalPostMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalPostMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalPostMetricAdjuster implements SeasonalPostMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalPostMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalPostMetricOpenRateOffsetAdjuster implements SeasonalPostMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: SeasonalPostMetric, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingSeasonalPostMetricAdjuster implements SeasonalPostMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalPostMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal post metric steps in order and keeps a trace of each. */
export class SeasonalPostMetricEngine {
  steps: SeasonalPostMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPostMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalPostMetric): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SeasonalPostMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalPostMetricEngine(flagsValue: flags.Registry): SeasonalPostMetricEngine {
  return new SeasonalPostMetricEngine(
    [
      new FlaggedSeasonalPostMetricAdjuster(flagsValue, "seasonal-post-metric-fallback", 7.8),
      new PercentSeasonalPostMetricAdjuster(21.6),
      new CapSeasonalPostMetricAdjuster(37811),
      new SeasonalPostMetricOpenRateOffsetAdjuster(1.66),
      new RoundingSeasonalPostMetricAdjuster(0.1),
    ],
    [],
    1.8,
    58383.3,
  );
}
