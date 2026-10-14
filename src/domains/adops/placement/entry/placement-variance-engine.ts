import * as numbers from "../../../../kit/numbers.js";
import { PlacementVariance } from "./placement-variance.js";

/** One step of the placement variance calculation. */
export interface PlacementVarianceStep {
  describe(): string;
  adjust(item: PlacementVariance, value: number): number;
}

export class LabelPlacementVarianceAdjuster implements PlacementVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PlacementVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPlacementVarianceAdjuster implements PlacementVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PlacementVarianceClicksOffsetAdjuster implements PlacementVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: PlacementVariance, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the placement variance steps in order and keeps a trace of each. */
export class PlacementVarianceEngine {
  steps: PlacementVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PlacementVariance): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PlacementVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPlacementVarianceEngine(): PlacementVarianceEngine {
  return new PlacementVarianceEngine(
    [
      new LabelPlacementVarianceAdjuster(
        new Map<string, number>([["central", 0.93], ["retail", 1.22], ["online", 0.79]]),
      ),
      new PercentPlacementVarianceAdjuster(-3),
      new PlacementVarianceClicksOffsetAdjuster(1.6),
    ],
    [],
    2.1,
    94412.8,
  );
}
