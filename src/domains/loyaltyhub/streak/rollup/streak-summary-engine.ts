import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakSummary } from "./streak-summary.js";

/** One step of the streak summary calculation. */
export interface StreakSummaryFactor {
  describe(): string;
  adjust(item: StreakSummary, value: number): number;
}

export class TieredStreakSummaryAdjuster implements StreakSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StreakSummaryWindowDaysOffsetAdjuster implements StreakSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: StreakSummary, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingStreakSummaryAdjuster implements StreakSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStreakSummaryAdjuster implements StreakSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStreakSummaryAdjuster implements StreakSummaryFactor {
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

  adjust(item: StreakSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the streak summary steps in order and keeps a trace of each. */
export class StreakSummaryEngine {
  steps: StreakSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakSummary): number {
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

  evaluateAll(items: StreakSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakSummaryEngine(flagsValue: flags.Registry): StreakSummaryEngine {
  return new StreakSummaryEngine(
    [
      new TieredStreakSummaryAdjuster([5110, 5263, 8949, 9141], [1.04, 1.06, 0.92, 1.06]),
      new StreakSummaryWindowDaysOffsetAdjuster(1.29),
      new RoundingStreakSummaryAdjuster(1),
      new MinimumStreakSummaryAdjuster(23.7),
      new FlaggedStreakSummaryAdjuster(flagsValue, "streak-summary-primary", 6.6),
    ],
    [],
    2.6,
    5255.2,
  );
}
