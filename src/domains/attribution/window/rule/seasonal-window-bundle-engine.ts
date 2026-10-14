import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWindowBundle } from "./seasonal-window-bundle.js";

/** One step of the seasonal window bundle calculation. */
export interface SeasonalWindowBundleStep {
  describe(): string;
  adjust(item: SeasonalWindowBundle, value: number): number;
}

export class RoundingSeasonalWindowBundleAdjuster implements SeasonalWindowBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalWindowBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSeasonalWindowBundleAdjuster implements SeasonalWindowBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalWindowBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalWindowBundleAdjuster implements SeasonalWindowBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalWindowBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceSeasonalWindowBundleAdjuster implements SeasonalWindowBundleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SeasonalWindowBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal window bundle steps in order and keeps a trace of each. */
export class SeasonalWindowBundleEngine {
  steps: SeasonalWindowBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWindowBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalWindowBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalWindowBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalWindowBundleEngine(): SeasonalWindowBundleEngine {
  return new SeasonalWindowBundleEngine(
    [
      new RoundingSeasonalWindowBundleAdjuster(5),
      new PercentSeasonalWindowBundleAdjuster(19),
      new CapSeasonalWindowBundleAdjuster(29445),
      new SourceSeasonalWindowBundleAdjuster(
        new Map<string, number>([["central", 1.36], ["east", 0.94], ["online", 0.76]]),
      ),
    ],
    [],
    2.5,
    83233.8,
  );
}
