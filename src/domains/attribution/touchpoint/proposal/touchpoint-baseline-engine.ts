import * as numbers from "../../../../kit/numbers.js";
import { TouchpointBaseline } from "./touchpoint-baseline.js";

/** One step of the touchpoint baseline calculation. */
export interface TouchpointBaselineAdjuster {
  describe(): string;
  adjust(item: TouchpointBaseline, value: number): number;
}

export class CapTouchpointBaselineAdjuster implements TouchpointBaselineAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTouchpointBaselineAdjuster implements TouchpointBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TouchpointBaselineOpenRateOffsetAdjuster implements TouchpointBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: TouchpointBaseline, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class PercentTouchpointBaselineAdjuster implements TouchpointBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTouchpointBaselineAdjuster implements TouchpointBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitTouchpointBaselineAdjuster implements TouchpointBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TouchpointBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the touchpoint baseline steps in order and keeps a trace of each. */
export class TouchpointBaselineEngine {
  steps: TouchpointBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TouchpointBaseline): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TouchpointBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTouchpointBaselineEngine(): TouchpointBaselineEngine {
  return new TouchpointBaselineEngine(
    [
      new CapTouchpointBaselineAdjuster(6146),
      new RoundingTouchpointBaselineAdjuster(5),
      new TouchpointBaselineOpenRateOffsetAdjuster(0.53),
      new PercentTouchpointBaselineAdjuster(-0.5),
      new TieredTouchpointBaselineAdjuster([28, 100, 2594], [0.81, 0.85, 0.83]),
      new UnitTouchpointBaselineAdjuster(new Map<string, number>([["north", 1.27], ["online", 0.8]])),
    ],
    [],
    3,
    26833.3,
  );
}
