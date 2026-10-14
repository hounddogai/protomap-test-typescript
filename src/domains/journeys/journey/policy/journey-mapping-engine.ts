import * as numbers from "../../../../kit/numbers.js";
import { JourneyMapping } from "./journey-mapping.js";

/** One step of the journey mapping calculation. */
export interface JourneyMappingFactor {
  describe(): string;
  adjust(item: JourneyMapping, value: number): number;
}

export class JourneyMappingCostOffsetAdjuster implements JourneyMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: JourneyMapping, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumJourneyMappingAdjuster implements JourneyMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingJourneyMappingAdjuster implements JourneyMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the journey mapping steps in order and keeps a trace of each. */
export class JourneyMappingEngine {
  steps: JourneyMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: JourneyMapping): number {
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

  evaluateAll(items: JourneyMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultJourneyMappingEngine(): JourneyMappingEngine {
  return new JourneyMappingEngine(
    [
      new JourneyMappingCostOffsetAdjuster(1.44),
      new MinimumJourneyMappingAdjuster(37.2),
      new RoundingJourneyMappingAdjuster(0.05),
    ],
    [],
    0.8,
    79987.7,
  );
}
