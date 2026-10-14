import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalRewardEntry } from "./seasonal-reward-entry.js";

/** One step of the seasonal reward entry calculation. */
export interface SeasonalRewardEntryFactor {
  describe(): string;
  adjust(item: SeasonalRewardEntry, value: number): number;
}

export class FlaggedSeasonalRewardEntryAdjuster implements SeasonalRewardEntryFactor {
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

  adjust(item: SeasonalRewardEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalRewardEntryQuantityOffsetAdjuster implements SeasonalRewardEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: SeasonalRewardEntry, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumSeasonalRewardEntryAdjuster implements SeasonalRewardEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalRewardEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSeasonalRewardEntryAdjuster implements SeasonalRewardEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalRewardEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalRewardEntryAdjuster implements SeasonalRewardEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRewardEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal reward entry steps in order and keeps a trace of each. */
export class SeasonalRewardEntryEngine {
  steps: SeasonalRewardEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRewardEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalRewardEntry): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalRewardEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalRewardEntryEngine(flagsValue: flags.Registry): SeasonalRewardEntryEngine {
  return new SeasonalRewardEntryEngine(
    [
      new FlaggedSeasonalRewardEntryAdjuster(flagsValue, "seasonal-reward-entry-global", 6.7),
      new SeasonalRewardEntryQuantityOffsetAdjuster(1.58),
      new MinimumSeasonalRewardEntryAdjuster(34),
      new RoundingSeasonalRewardEntryAdjuster(0.25),
      new TieredSeasonalRewardEntryAdjuster([1206, 7774], [0.8, 1.03]),
    ],
    [],
    4,
    89887.7,
  );
}
