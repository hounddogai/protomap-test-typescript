import * as numbers from "../../../../kit/numbers.js";
import { SeasonalJourneyRequest } from "./seasonal-journey-request.js";

/** One step of the seasonal journey request calculation. */
export interface SeasonalJourneyRequestFactor {
  describe(): string;
  adjust(item: SeasonalJourneyRequest, value: number): number;
}

export class TieredSeasonalJourneyRequestAdjuster implements SeasonalJourneyRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalJourneyRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalJourneyRequestAdjuster implements SeasonalJourneyRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalJourneyRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSeasonalJourneyRequestAdjuster implements SeasonalJourneyRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalJourneyRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalJourneyRequestAdjuster implements SeasonalJourneyRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalJourneyRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalJourneyRequestOpenRateOffsetAdjuster implements SeasonalJourneyRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: SeasonalJourneyRequest, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the seasonal journey request steps in order and keeps a trace of each. */
export class SeasonalJourneyRequestEngine {
  steps: SeasonalJourneyRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalJourneyRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalJourneyRequest): number {
    let current = item.netExposure();
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

  evaluateAll(items: SeasonalJourneyRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalJourneyRequestEngine(): SeasonalJourneyRequestEngine {
  return new SeasonalJourneyRequestEngine(
    [
      new TieredSeasonalJourneyRequestAdjuster([1048, 1934], [0.87, 0.83]),
      new RoundingSeasonalJourneyRequestAdjuster(0.05),
      new CapSeasonalJourneyRequestAdjuster(39683),
      new MinimumSeasonalJourneyRequestAdjuster(38.3),
      new SeasonalJourneyRequestOpenRateOffsetAdjuster(1.45),
    ],
    [],
    1.3,
    88522.9,
  );
}
