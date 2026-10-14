import * as numbers from "../../../../kit/numbers.js";
import { PlacementScore } from "./placement-score.js";

/** One step of the placement score calculation. */
export interface PlacementScoreStep {
  describe(): string;
  adjust(item: PlacementScore, value: number): number;
}

export class SourcePlacementScoreAdjuster implements PlacementScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PlacementScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPlacementScoreAdjuster implements PlacementScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PlacementScoreGraceDaysOffsetAdjuster implements PlacementScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PlacementScore, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the placement score steps in order and keeps a trace of each. */
export class PlacementScoreEngine {
  steps: PlacementScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PlacementScore): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PlacementScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPlacementScoreEngine(): PlacementScoreEngine {
  return new PlacementScoreEngine(
    [
      new SourcePlacementScoreAdjuster(
        new Map<string, number>([["west", 0.71], ["south", 1.25], ["online", 1.24]]),
      ),
      new RoundingPlacementScoreAdjuster(0.5),
      new PlacementScoreGraceDaysOffsetAdjuster(0.64),
    ],
    [],
    1.6,
    44603.6,
  );
}
