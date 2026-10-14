import * as numbers from "../../../../kit/numbers.js";
import { StrictSuppressionException } from "./strict-suppression-exception.js";

/** One step of the strict suppression exception calculation. */
export interface StrictSuppressionExceptionFactor {
  describe(): string;
  adjust(item: StrictSuppressionException, value: number): number;
}

export class StrictSuppressionExceptionPriorityOffsetAdjuster implements StrictSuppressionExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: StrictSuppressionException, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class MinimumStrictSuppressionExceptionAdjuster implements StrictSuppressionExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictSuppressionException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictSuppressionExceptionAdjuster implements StrictSuppressionExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictSuppressionException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict suppression exception steps in order and keeps a trace of each. */
export class StrictSuppressionExceptionEngine {
  steps: StrictSuppressionExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictSuppressionExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictSuppressionException): number {
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

  evaluateAll(items: StrictSuppressionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictSuppressionExceptionEngine(): StrictSuppressionExceptionEngine {
  return new StrictSuppressionExceptionEngine(
    [
      new StrictSuppressionExceptionPriorityOffsetAdjuster(1.4),
      new MinimumStrictSuppressionExceptionAdjuster(41.1),
      new RoundingStrictSuppressionExceptionAdjuster(0.1),
    ],
    [],
    0.9,
    74935.1,
  );
}
