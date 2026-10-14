import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPacingEstimate } from "./primary-pacing-estimate.js";

/** One step of the primary pacing estimate calculation. */
export interface PrimaryPacingEstimateAdjuster {
  describe(): string;
  adjust(item: PrimaryPacingEstimate, value: number): number;
}

export class PrimaryPacingEstimateCeilingOffsetAdjuster implements PrimaryPacingEstimateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PrimaryPacingEstimate, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumPrimaryPacingEstimateAdjuster implements PrimaryPacingEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPacingEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPrimaryPacingEstimateAdjuster implements PrimaryPacingEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPacingEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary pacing estimate steps in order and keeps a trace of each. */
export class PrimaryPacingEstimateEngine {
  steps: PrimaryPacingEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPacingEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPacingEstimate): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PrimaryPacingEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPacingEstimateEngine(): PrimaryPacingEstimateEngine {
  return new PrimaryPacingEstimateEngine(
    [
      new PrimaryPacingEstimateCeilingOffsetAdjuster(0.36),
      new MinimumPrimaryPacingEstimateAdjuster(2.5),
      new RoundingPrimaryPacingEstimateAdjuster(0.05),
    ],
    [],
    2.7,
    6027,
  );
}
