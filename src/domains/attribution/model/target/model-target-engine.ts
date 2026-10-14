import { ModelTarget } from "./model-target.js";

/** One step of the model target calculation. */
export interface ModelTargetAdjuster {
  describe(): string;
  adjust(item: ModelTarget, value: number): number;
}

export class MinimumModelTargetAdjuster implements ModelTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredModelTargetAdjuster implements ModelTargetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceModelTargetAdjuster implements ModelTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ModelTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the model target steps in order and keeps a trace of each. */
export class ModelTargetEngine {
  steps: ModelTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelTarget): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ModelTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelTargetEngine(): ModelTargetEngine {
  return new ModelTargetEngine(
    [
      new MinimumModelTargetAdjuster(23.9),
      new TieredModelTargetAdjuster([4687, 7528, 8328], [0.83, 1.1, 0.83]),
      new UtmSourceModelTargetAdjuster(new Map<string, number>([["south", 1.33], ["central", 1.1]])),
    ],
    [],
    0.3,
    39146.3,
  );
}
