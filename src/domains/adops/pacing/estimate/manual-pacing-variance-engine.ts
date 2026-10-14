import * as numbers from "../../../../kit/numbers.js";
import { ManualPacingVariance } from "./manual-pacing-variance.js";

/** One step of the manual pacing variance calculation. */
export interface ManualPacingVarianceFactor {
  describe(): string;
  adjust(item: ManualPacingVariance, value: number): number;
}

export class RoundingManualPacingVarianceAdjuster implements ManualPacingVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPacingVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualPacingVarianceCapacityOffsetAdjuster implements ManualPacingVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ManualPacingVariance, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class PercentManualPacingVarianceAdjuster implements ManualPacingVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPacingVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual pacing variance steps in order and keeps a trace of each. */
export class ManualPacingVarianceEngine {
  steps: ManualPacingVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPacingVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualPacingVariance): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ManualPacingVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualPacingVarianceEngine(): ManualPacingVarianceEngine {
  return new ManualPacingVarianceEngine(
    [
      new RoundingManualPacingVarianceAdjuster(5),
      new ManualPacingVarianceCapacityOffsetAdjuster(1.54),
      new PercentManualPacingVarianceAdjuster(6.6),
    ],
    [],
    2.1,
    27193.3,
  );
}
