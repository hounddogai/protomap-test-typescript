import * as numbers from "../../../../kit/numbers.js";
import { DefaultActivationTarget } from "./default-activation-target.js";

/** One step of the default activation target calculation. */
export interface DefaultActivationTargetFactor {
  describe(): string;
  adjust(item: DefaultActivationTarget, value: number): number;
}

export class CapDefaultActivationTargetAdjuster implements DefaultActivationTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultActivationTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceDefaultActivationTargetAdjuster implements DefaultActivationTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: DefaultActivationTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDefaultActivationTargetAdjuster implements DefaultActivationTargetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultActivationTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultActivationTargetAdjuster implements DefaultActivationTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultActivationTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default activation target steps in order and keeps a trace of each. */
export class DefaultActivationTargetEngine {
  steps: DefaultActivationTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultActivationTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultActivationTarget): number {
    let current = item.netLoad();
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

  evaluateAll(items: DefaultActivationTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultActivationTargetEngine(): DefaultActivationTargetEngine {
  return new DefaultActivationTargetEngine(
    [
      new CapDefaultActivationTargetAdjuster(10172),
      new SourceDefaultActivationTargetAdjuster(new Map<string, number>([["central", 1.01]])),
      new RoundingDefaultActivationTargetAdjuster(1),
      new TieredDefaultActivationTargetAdjuster([3340, 5242], [1.13, 0.98]),
    ],
    [],
    2.5,
    23405.1,
  );
}
