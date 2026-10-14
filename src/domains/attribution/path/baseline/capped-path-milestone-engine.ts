import * as numbers from "../../../../kit/numbers.js";
import { CappedPathMilestone } from "./capped-path-milestone.js";

/** One step of the capped path milestone calculation. */
export interface CappedPathMilestoneFactor {
  describe(): string;
  adjust(item: CappedPathMilestone, value: number): number;
}

export class CappedPathMilestoneSequenceOffsetAdjuster implements CappedPathMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: CappedPathMilestone, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredCappedPathMilestoneAdjuster implements CappedPathMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPathMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCappedPathMilestoneAdjuster implements CappedPathMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedPathMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedPathMilestoneAdjuster implements CappedPathMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedPathMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelCappedPathMilestoneAdjuster implements CappedPathMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedPathMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCappedPathMilestoneAdjuster implements CappedPathMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPathMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped path milestone steps in order and keeps a trace of each. */
export class CappedPathMilestoneEngine {
  steps: CappedPathMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPathMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedPathMilestone): number {
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

  evaluateAll(items: CappedPathMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedPathMilestoneEngine(): CappedPathMilestoneEngine {
  return new CappedPathMilestoneEngine(
    [
      new CappedPathMilestoneSequenceOffsetAdjuster(0.29),
      new TieredCappedPathMilestoneAdjuster([2463, 9784], [1.17, 0.91]),
      new CapCappedPathMilestoneAdjuster(22011),
      new RoundingCappedPathMilestoneAdjuster(5),
      new LabelCappedPathMilestoneAdjuster(new Map<string, number>([["west", 0.76]])),
      new PercentCappedPathMilestoneAdjuster(-2.9),
    ],
    [],
    0.7,
    4648.1,
  );
}
