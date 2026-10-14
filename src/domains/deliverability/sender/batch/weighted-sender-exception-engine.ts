import * as numbers from "../../../../kit/numbers.js";
import { WeightedSenderException } from "./weighted-sender-exception.js";

/** One step of the weighted sender exception calculation. */
export interface WeightedSenderExceptionFactor {
  describe(): string;
  adjust(item: WeightedSenderException, value: number): number;
}

export class ChannelWeightedSenderExceptionAdjuster implements WeightedSenderExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedSenderException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedSenderExceptionAdjuster implements WeightedSenderExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedSenderException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedSenderExceptionAdjuster implements WeightedSenderExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedSenderException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedSenderExceptionWindowDaysOffsetAdjuster implements WeightedSenderExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: WeightedSenderException, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the weighted sender exception steps in order and keeps a trace of each. */
export class WeightedSenderExceptionEngine {
  steps: WeightedSenderExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedSenderExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedSenderException): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WeightedSenderException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedSenderExceptionEngine(): WeightedSenderExceptionEngine {
  return new WeightedSenderExceptionEngine(
    [
      new ChannelWeightedSenderExceptionAdjuster(new Map<string, number>([["south", 1.17]])),
      new CapWeightedSenderExceptionAdjuster(21084),
      new RoundingWeightedSenderExceptionAdjuster(0.05),
      new WeightedSenderExceptionWindowDaysOffsetAdjuster(0.76),
    ],
    [],
    4.4,
    92489.4,
  );
}
