import * as numbers from "../../../../kit/numbers.js";
import { RollingWarmupMapping } from "./rolling-warmup-mapping.js";

/** One step of the rolling warmup mapping calculation. */
export interface RollingWarmupMappingFactor {
  describe(): string;
  adjust(item: RollingWarmupMapping, value: number): number;
}

export class CapRollingWarmupMappingAdjuster implements RollingWarmupMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWarmupMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingWarmupMappingAdjuster implements RollingWarmupMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWarmupMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingWarmupMappingSequenceOffsetAdjuster implements RollingWarmupMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RollingWarmupMapping, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the rolling warmup mapping steps in order and keeps a trace of each. */
export class RollingWarmupMappingEngine {
  steps: RollingWarmupMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWarmupMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingWarmupMapping): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RollingWarmupMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingWarmupMappingEngine(): RollingWarmupMappingEngine {
  return new RollingWarmupMappingEngine(
    [
      new CapRollingWarmupMappingAdjuster(5290),
      new RoundingRollingWarmupMappingAdjuster(0.5),
      new RollingWarmupMappingSequenceOffsetAdjuster(1.37),
    ],
    [],
    3,
    53693.3,
  );
}
