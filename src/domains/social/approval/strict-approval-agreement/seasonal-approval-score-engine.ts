import * as numbers from "../../../../kit/numbers.js";
import { SeasonalApprovalScore } from "./seasonal-approval-score.js";

/** One step of the seasonal approval score calculation. */
export interface SeasonalApprovalScoreFactor {
  describe(): string;
  adjust(item: SeasonalApprovalScore, value: number): number;
}

export class CapSeasonalApprovalScoreAdjuster implements SeasonalApprovalScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalApprovalScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalApprovalScoreAdjuster implements SeasonalApprovalScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalApprovalScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalApprovalScoreAdjuster implements SeasonalApprovalScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalApprovalScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal approval score steps in order and keeps a trace of each. */
export class SeasonalApprovalScoreEngine {
  steps: SeasonalApprovalScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalApprovalScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalApprovalScore): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalApprovalScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalApprovalScoreEngine(): SeasonalApprovalScoreEngine {
  return new SeasonalApprovalScoreEngine(
    [
      new CapSeasonalApprovalScoreAdjuster(18539),
      new TieredSeasonalApprovalScoreAdjuster([833, 5725], [0.84, 0.86]),
      new RoundingSeasonalApprovalScoreAdjuster(0.25),
    ],
    [],
    0.6,
    67712.2,
  );
}
