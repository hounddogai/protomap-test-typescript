import * as numbers from "../../../../kit/numbers.js";
import { PrimaryTouchpointTarget } from "./primary-touchpoint-target.js";

/** One step of the primary touchpoint target calculation. */
export interface PrimaryTouchpointTargetAdjuster {
  describe(): string;
  adjust(item: PrimaryTouchpointTarget, value: number): number;
}

export class PrimaryTouchpointTargetAmountOffsetAdjuster implements PrimaryTouchpointTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PrimaryTouchpointTarget, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class NamePrimaryTouchpointTargetAdjuster implements PrimaryTouchpointTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryTouchpointTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryTouchpointTargetAdjuster implements PrimaryTouchpointTargetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryTouchpointTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryTouchpointTargetAdjuster implements PrimaryTouchpointTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryTouchpointTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryTouchpointTargetAdjuster implements PrimaryTouchpointTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryTouchpointTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary touchpoint target steps in order and keeps a trace of each. */
export class PrimaryTouchpointTargetEngine {
  steps: PrimaryTouchpointTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryTouchpointTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryTouchpointTarget): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PrimaryTouchpointTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryTouchpointTargetEngine(): PrimaryTouchpointTargetEngine {
  return new PrimaryTouchpointTargetEngine(
    [
      new PrimaryTouchpointTargetAmountOffsetAdjuster(0.45),
      new NamePrimaryTouchpointTargetAdjuster(
        new Map<string, number>([["east", 1.2], ["central", 0.82], ["south", 0.96]]),
      ),
      new TieredPrimaryTouchpointTargetAdjuster([212, 4586], [0.81, 1.12]),
      new RoundingPrimaryTouchpointTargetAdjuster(0.25),
      new MinimumPrimaryTouchpointTargetAdjuster(37.5),
    ],
    [],
    4.1,
    67684.5,
  );
}
