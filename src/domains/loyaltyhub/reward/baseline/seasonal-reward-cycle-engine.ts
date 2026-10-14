import { SeasonalRewardCycle } from "./seasonal-reward-cycle.js";

/** One step of the seasonal reward cycle calculation. */
export interface SeasonalRewardCycleModifier {
  describe(): string;
  adjust(item: SeasonalRewardCycle, value: number): number;
}

export class TieredSeasonalRewardCycleAdjuster implements SeasonalRewardCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRewardCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalRewardCycleGraceDaysOffsetAdjuster implements SeasonalRewardCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: SeasonalRewardCycle, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CountrySeasonalRewardCycleAdjuster implements SeasonalRewardCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalRewardCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal reward cycle steps in order and keeps a trace of each. */
export class SeasonalRewardCycleEngine {
  steps: SeasonalRewardCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRewardCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalRewardCycle): number {
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

  evaluateAll(items: SeasonalRewardCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalRewardCycleEngine(): SeasonalRewardCycleEngine {
  return new SeasonalRewardCycleEngine(
    [
      new TieredSeasonalRewardCycleAdjuster([5932, 6353], [1.12, 0.85]),
      new SeasonalRewardCycleGraceDaysOffsetAdjuster(0.75),
      new CountrySeasonalRewardCycleAdjuster(new Map<string, number>([["south", 1.18], ["retail", 1.01]])),
    ],
    [],
    3.1,
    53631.6,
  );
}
