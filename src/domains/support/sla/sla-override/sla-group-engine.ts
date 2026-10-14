import * as numbers from "../../../../kit/numbers.js";
import { SlaGroup } from "./sla-group.js";

/** One step of the sla group calculation. */
export interface SlaGroupModifier {
  describe(): string;
  adjust(item: SlaGroup, value: number): number;
}

export class TieredSlaGroupAdjuster implements SlaGroupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionSlaGroupAdjuster implements SlaGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: SlaGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSlaGroupAdjuster implements SlaGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSlaGroupAdjuster implements SlaGroupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSlaGroupAdjuster implements SlaGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sla group steps in order and keeps a trace of each. */
export class SlaGroupEngine {
  steps: SlaGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaGroup): number {
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

  evaluateAll(items: SlaGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaGroupEngine(): SlaGroupEngine {
  return new SlaGroupEngine(
    [
      new TieredSlaGroupAdjuster([1197, 7845, 9945], [0.91, 0.95, 0.96]),
      new RegionSlaGroupAdjuster(new Map<string, number>([["east", 0.91]])),
      new CapSlaGroupAdjuster(30325),
      new PercentSlaGroupAdjuster(7.8),
      new RoundingSlaGroupAdjuster(0.05),
    ],
    [],
    3.9,
    29580.4,
  );
}
