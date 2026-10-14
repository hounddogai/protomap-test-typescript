import * as numbers from "../../../../kit/numbers.js";
import { CsatCycle } from "./csat-cycle.js";

/** One step of the csat cycle calculation. */
export interface CsatCycleStep {
  describe(): string;
  adjust(item: CsatCycle, value: number): number;
}

export class CapCsatCycleAdjuster implements CsatCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCsatCycleAdjuster implements CsatCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCsatCycleAdjuster implements CsatCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCsatCycleAdjuster implements CsatCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameCsatCycleAdjuster implements CsatCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CsatCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CsatCycleBatchSizeOffsetAdjuster implements CsatCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: CsatCycle, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the csat cycle steps in order and keeps a trace of each. */
export class CsatCycleEngine {
  steps: CsatCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CsatCycle): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: CsatCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCsatCycleEngine(): CsatCycleEngine {
  return new CsatCycleEngine(
    [
      new CapCsatCycleAdjuster(20631),
      new PercentCsatCycleAdjuster(-17.2),
      new TieredCsatCycleAdjuster([1821, 3552, 4555], [0.97, 0.97, 0.85]),
      new RoundingCsatCycleAdjuster(0.5),
      new NameCsatCycleAdjuster(new Map<string, number>([["central", 0.76], ["online", 1.13], ["east", 0.9]])),
      new CsatCycleBatchSizeOffsetAdjuster(1.21),
    ],
    [],
    1.7,
    39585.4,
  );
}
