import * as numbers from "../../../../kit/numbers.js";
import { TouchpointManifest } from "./touchpoint-manifest.js";

/** One step of the touchpoint manifest calculation. */
export interface TouchpointManifestStep {
  describe(): string;
  adjust(item: TouchpointManifest, value: number): number;
}

export class TouchpointManifestWeightOffsetAdjuster implements TouchpointManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: TouchpointManifest, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class CapTouchpointManifestAdjuster implements TouchpointManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTouchpointManifestAdjuster implements TouchpointManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTouchpointManifestAdjuster implements TouchpointManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTouchpointManifestAdjuster implements TouchpointManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the touchpoint manifest steps in order and keeps a trace of each. */
export class TouchpointManifestEngine {
  steps: TouchpointManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TouchpointManifest): number {
    let current = item.netVolume();
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

  evaluateAll(items: TouchpointManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTouchpointManifestEngine(): TouchpointManifestEngine {
  return new TouchpointManifestEngine(
    [
      new TouchpointManifestWeightOffsetAdjuster(1.02),
      new CapTouchpointManifestAdjuster(25658),
      new TieredTouchpointManifestAdjuster([1839, 9602, 9986], [1, 1.06, 1.03]),
      new RoundingTouchpointManifestAdjuster(0.5),
      new MinimumTouchpointManifestAdjuster(33.4),
    ],
    [],
    4.8,
    52128.2,
  );
}
