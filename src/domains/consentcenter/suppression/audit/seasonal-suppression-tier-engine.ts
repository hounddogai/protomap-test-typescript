import * as numbers from "../../../../kit/numbers.js";
import { SeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

/** One step of the seasonal suppression tier calculation. */
export interface SeasonalSuppressionTierModifier {
  describe(): string;
  adjust(item: SeasonalSuppressionTier, value: number): number;
}

export class TieredSeasonalSuppressionTierAdjuster implements SeasonalSuppressionTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSuppressionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalSuppressionTierAdjuster implements SeasonalSuppressionTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalSuppressionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SeasonalSuppressionTierWindowDaysOffsetAdjuster implements SeasonalSuppressionTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: SeasonalSuppressionTier, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the seasonal suppression tier steps in order and keeps a trace of each. */
export class SeasonalSuppressionTierEngine {
  steps: SeasonalSuppressionTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSuppressionTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalSuppressionTier): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: SeasonalSuppressionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalSuppressionTierEngine(): SeasonalSuppressionTierEngine {
  return new SeasonalSuppressionTierEngine(
    [
      new TieredSeasonalSuppressionTierAdjuster([1207, 5279, 6369, 7874], [1.12, 1.11, 0.95, 0.95]),
      new RoundingSeasonalSuppressionTierAdjuster(0.05),
      new SeasonalSuppressionTierWindowDaysOffsetAdjuster(1.7),
    ],
    [],
    3.3,
    59247.2,
  );
}
