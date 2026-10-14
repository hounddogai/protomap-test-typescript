import * as numbers from "../../../../kit/numbers.js";
import { StepDigest } from "./step-digest.js";

/** One step of the step digest calculation. */
export interface StepDigestAdjuster {
  describe(): string;
  adjust(item: StepDigest, value: number): number;
}

export class StepDigestSequenceOffsetAdjuster implements StepDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: StepDigest, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class RoundingStepDigestAdjuster implements StepDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStepDigestAdjuster implements StepDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the step digest steps in order and keeps a trace of each. */
export class StepDigestEngine {
  steps: StepDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepDigest): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StepDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepDigestEngine(): StepDigestEngine {
  return new StepDigestEngine(
    [
      new StepDigestSequenceOffsetAdjuster(1.39),
      new RoundingStepDigestAdjuster(0.05),
      new TieredStepDigestAdjuster([442, 1160, 3232], [1.05, 0.89, 0.83]),
    ],
    [],
    1.7,
    78723.6,
  );
}
