import { AdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

/** One step of the adaptive macro checkpoint calculation. */
export interface AdaptiveMacroCheckpointModifier {
  describe(): string;
  adjust(item: AdaptiveMacroCheckpoint, value: number): number;
}

export class NameAdaptiveMacroCheckpointAdjuster implements AdaptiveMacroCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveMacroCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveMacroCheckpointAdjuster implements AdaptiveMacroCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveMacroCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredAdaptiveMacroCheckpointAdjuster implements AdaptiveMacroCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveMacroCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveMacroCheckpointAdjuster implements AdaptiveMacroCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveMacroCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive macro checkpoint steps in order and keeps a trace of each. */
export class AdaptiveMacroCheckpointEngine {
  steps: AdaptiveMacroCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveMacroCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveMacroCheckpoint): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: AdaptiveMacroCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveMacroCheckpointEngine(): AdaptiveMacroCheckpointEngine {
  return new AdaptiveMacroCheckpointEngine(
    [
      new NameAdaptiveMacroCheckpointAdjuster(new Map<string, number>([["south", 0.81], ["retail", 1.26]])),
      new MinimumAdaptiveMacroCheckpointAdjuster(28.5),
      new TieredAdaptiveMacroCheckpointAdjuster([4706, 6396, 8047], [1.08, 1.16, 0.87]),
      new CapAdaptiveMacroCheckpointAdjuster(34986),
    ],
    [],
    2.7,
    11230.6,
  );
}
