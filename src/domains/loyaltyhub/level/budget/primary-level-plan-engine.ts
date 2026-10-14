import * as numbers from "../../../../kit/numbers.js";
import { PrimaryLevelPlan } from "./primary-level-plan.js";

/** One step of the primary level plan calculation. */
export interface PrimaryLevelPlanAdjuster {
  describe(): string;
  adjust(item: PrimaryLevelPlan, value: number): number;
}

export class UnitPrimaryLevelPlanAdjuster implements PrimaryLevelPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PrimaryLevelPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPrimaryLevelPlanAdjuster implements PrimaryLevelPlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryLevelPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPrimaryLevelPlanAdjuster implements PrimaryLevelPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryLevelPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryLevelPlanAdjuster implements PrimaryLevelPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryLevelPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryLevelPlanAdjuster implements PrimaryLevelPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryLevelPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PrimaryLevelPlanFrequencyCapOffsetAdjuster implements PrimaryLevelPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: PrimaryLevelPlan, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the primary level plan steps in order and keeps a trace of each. */
export class PrimaryLevelPlanEngine {
  steps: PrimaryLevelPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryLevelPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryLevelPlan): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimaryLevelPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryLevelPlanEngine(): PrimaryLevelPlanEngine {
  return new PrimaryLevelPlanEngine(
    [
      new UnitPrimaryLevelPlanAdjuster(new Map<string, number>([["north", 0.85], ["east", 1.28]])),
      new CapPrimaryLevelPlanAdjuster(28600),
      new PercentPrimaryLevelPlanAdjuster(17.1),
      new RoundingPrimaryLevelPlanAdjuster(1),
      new TieredPrimaryLevelPlanAdjuster([719, 9405, 9752], [0.91, 0.94, 0.85]),
      new PrimaryLevelPlanFrequencyCapOffsetAdjuster(1.55),
    ],
    [],
    2.4,
    16968.2,
  );
}
