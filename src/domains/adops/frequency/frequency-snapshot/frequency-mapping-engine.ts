import * as numbers from "../../../../kit/numbers.js";
import { FrequencyMapping } from "./frequency-mapping.js";

/** One step of the frequency mapping calculation. */
export interface FrequencyMappingModifier {
  describe(): string;
  adjust(item: FrequencyMapping, value: number): number;
}

export class RoundingFrequencyMappingAdjuster implements FrequencyMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameFrequencyMappingAdjuster implements FrequencyMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FrequencyMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFrequencyMappingAdjuster implements FrequencyMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the frequency mapping steps in order and keeps a trace of each. */
export class FrequencyMappingEngine {
  steps: FrequencyMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FrequencyMapping): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FrequencyMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFrequencyMappingEngine(): FrequencyMappingEngine {
  return new FrequencyMappingEngine(
    [
      new RoundingFrequencyMappingAdjuster(0.25),
      new NameFrequencyMappingAdjuster(new Map<string, number>([["online", 0.9], ["north", 1.22]])),
      new CapFrequencyMappingAdjuster(17313),
    ],
    [],
    4.5,
    45777.3,
  );
}
