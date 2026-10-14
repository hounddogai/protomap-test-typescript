import * as numbers from "../../../../kit/numbers.js";
import { WeightedSlaMapping } from "./weighted-sla-mapping.js";

/** One step of the weighted sla mapping calculation. */
export interface WeightedSlaMappingStep {
  describe(): string;
  adjust(item: WeightedSlaMapping, value: number): number;
}

export class RoundingWeightedSlaMappingAdjuster implements WeightedSlaMappingStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedSlaMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedSlaMappingAdjuster implements WeightedSlaMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedSlaMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WeightedSlaMappingSequenceOffsetAdjuster implements WeightedSlaMappingStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: WeightedSlaMapping, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the weighted sla mapping steps in order and keeps a trace of each. */
export class WeightedSlaMappingEngine {
  steps: WeightedSlaMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedSlaMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedSlaMapping): number {
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

  evaluateAll(items: WeightedSlaMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedSlaMappingEngine(): WeightedSlaMappingEngine {
  return new WeightedSlaMappingEngine(
    [
      new RoundingWeightedSlaMappingAdjuster(0.05),
      new CapWeightedSlaMappingAdjuster(30532),
      new WeightedSlaMappingSequenceOffsetAdjuster(1.9),
    ],
    [],
    2.2,
    7658.2,
  );
}
