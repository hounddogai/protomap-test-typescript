import * as numbers from "../../../../kit/numbers.js";
import { PlacementBundle } from "./placement-bundle.js";

/** One step of the placement bundle calculation. */
export interface PlacementBundleStep {
  describe(): string;
  adjust(item: PlacementBundle, value: number): number;
}

export class PercentPlacementBundleAdjuster implements PlacementBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPlacementBundleAdjuster implements PlacementBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPlacementBundleAdjuster implements PlacementBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the placement bundle steps in order and keeps a trace of each. */
export class PlacementBundleEngine {
  steps: PlacementBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementBundle): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PlacementBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementBundleEngine(): PlacementBundleEngine {
  return new PlacementBundleEngine(
    [
      new PercentPlacementBundleAdjuster(-6.7),
      new RoundingPlacementBundleAdjuster(0.5),
      new MinimumPlacementBundleAdjuster(7),
    ],
    [],
    2.5,
    93274.1,
  );
}
