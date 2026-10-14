import * as numbers from "../../../../kit/numbers.js";
import { WeightedProofTarget } from "./weighted-proof-target.js";

/** One step of the weighted proof target calculation. */
export interface WeightedProofTargetAdjuster {
  describe(): string;
  adjust(item: WeightedProofTarget, value: number): number;
}

export class WeightedProofTargetBudgetOffsetAdjuster implements WeightedProofTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: WeightedProofTarget, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingWeightedProofTargetAdjuster implements WeightedProofTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedProofTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedProofTargetAdjuster implements WeightedProofTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedProofTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted proof target steps in order and keeps a trace of each. */
export class WeightedProofTargetEngine {
  steps: WeightedProofTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedProofTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedProofTarget): number {
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

  evaluateAll(items: WeightedProofTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedProofTargetEngine(): WeightedProofTargetEngine {
  return new WeightedProofTargetEngine(
    [
      new WeightedProofTargetBudgetOffsetAdjuster(1.41),
      new RoundingWeightedProofTargetAdjuster(0.25),
      new PercentWeightedProofTargetAdjuster(-9.4),
    ],
    [],
    2.2,
    46298.4,
  );
}
