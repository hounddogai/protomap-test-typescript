import * as numbers from "../../../../kit/numbers.js";
import { PacingMapping } from "./pacing-mapping.js";

/** One step of the pacing mapping calculation. */
export interface PacingMappingFactor {
  describe(): string;
  adjust(item: PacingMapping, value: number): number;
}

export class PacingMappingPriorityOffsetAdjuster implements PacingMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PacingMapping, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class PercentPacingMappingAdjuster implements PacingMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelPacingMappingAdjuster implements PacingMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PacingMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPacingMappingAdjuster implements PacingMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPacingMappingAdjuster implements PacingMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pacing mapping steps in order and keeps a trace of each. */
export class PacingMappingEngine {
  steps: PacingMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PacingMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PacingMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPacingMappingEngine(): PacingMappingEngine {
  return new PacingMappingEngine(
    [
      new PacingMappingPriorityOffsetAdjuster(0.42),
      new PercentPacingMappingAdjuster(-1.5),
      new LabelPacingMappingAdjuster(
        new Map<string, number>([["central", 1.06], ["north", 1.24], ["retail", 1.35]]),
      ),
      new RoundingPacingMappingAdjuster(0.5),
      new TieredPacingMappingAdjuster([970, 8903, 9817], [1.14, 1.13, 1.13]),
    ],
    [],
    4.2,
    29960.2,
  );
}
