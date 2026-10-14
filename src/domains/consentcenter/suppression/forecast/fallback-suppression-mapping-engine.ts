import { FallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

/** One step of the fallback suppression mapping calculation. */
export interface FallbackSuppressionMappingFactor {
  describe(): string;
  adjust(item: FallbackSuppressionMapping, value: number): number;
}

export class PercentFallbackSuppressionMappingAdjuster implements FallbackSuppressionMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackSuppressionMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackSuppressionMappingFloorValueOffsetAdjuster implements FallbackSuppressionMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: FallbackSuppressionMapping, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class MinimumFallbackSuppressionMappingAdjuster implements FallbackSuppressionMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSuppressionMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback suppression mapping steps in order and keeps a trace of each. */
export class FallbackSuppressionMappingEngine {
  steps: FallbackSuppressionMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSuppressionMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackSuppressionMapping): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: FallbackSuppressionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackSuppressionMappingEngine(): FallbackSuppressionMappingEngine {
  return new FallbackSuppressionMappingEngine(
    [
      new PercentFallbackSuppressionMappingAdjuster(12),
      new FallbackSuppressionMappingFloorValueOffsetAdjuster(1.23),
      new MinimumFallbackSuppressionMappingAdjuster(41.9),
    ],
    [],
    4,
    67007.9,
  );
}
