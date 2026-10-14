import * as numbers from "../../../../kit/numbers.js";
import { RollingPathMapping } from "./rolling-path-mapping.js";

/** One step of the rolling path mapping calculation. */
export interface RollingPathMappingStep {
  describe(): string;
  adjust(item: RollingPathMapping, value: number): number;
}

export class RollingPathMappingVersionOffsetAdjuster implements RollingPathMappingStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RollingPathMapping, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingRollingPathMappingAdjuster implements RollingPathMappingStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPathMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRollingPathMappingAdjuster implements RollingPathMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingPathMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling path mapping steps in order and keeps a trace of each. */
export class RollingPathMappingEngine {
  steps: RollingPathMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPathMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingPathMapping): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RollingPathMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingPathMappingEngine(): RollingPathMappingEngine {
  return new RollingPathMappingEngine(
    [
      new RollingPathMappingVersionOffsetAdjuster(0.02),
      new RoundingRollingPathMappingAdjuster(0.1),
      new TieredRollingPathMappingAdjuster([1002, 5833, 8640, 9664], [0.85, 0.9, 1.15, 1.11]),
    ],
    [],
    2.9,
    82152.7,
  );
}
