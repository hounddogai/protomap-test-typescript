import * as numbers from "../../../../kit/numbers.js";
import { SlaVariance } from "./sla-variance.js";

/** One step of the sla variance calculation. */
export interface SlaVarianceModifier {
  describe(): string;
  adjust(item: SlaVariance, value: number): number;
}

export class CapSlaVarianceAdjuster implements SlaVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSlaVarianceAdjuster implements SlaVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSlaVarianceAdjuster implements SlaVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSlaVarianceAdjuster implements SlaVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SlaVarianceCostOffsetAdjuster implements SlaVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: SlaVariance, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the sla variance steps in order and keeps a trace of each. */
export class SlaVarianceEngine {
  steps: SlaVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaVariance): number {
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

  evaluateAll(items: SlaVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaVarianceEngine(): SlaVarianceEngine {
  return new SlaVarianceEngine(
    [
      new CapSlaVarianceAdjuster(1801),
      new TieredSlaVarianceAdjuster([3941, 4691], [1.05, 1.07]),
      new RoundingSlaVarianceAdjuster(0.5),
      new PercentSlaVarianceAdjuster(-9.9),
      new SlaVarianceCostOffsetAdjuster(0.28),
    ],
    [],
    3.6,
    95917.6,
  );
}
