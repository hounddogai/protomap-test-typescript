import * as numbers from "../../../../kit/numbers.js";
import { JourneyThreshold } from "./journey-threshold.js";

/** One step of the journey threshold calculation. */
export interface JourneyThresholdAdjuster {
  describe(): string;
  adjust(item: JourneyThreshold, value: number): number;
}

export class MinimumJourneyThresholdAdjuster implements JourneyThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class JourneyThresholdConversionRateOffsetAdjuster implements JourneyThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: JourneyThreshold, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class RoundingJourneyThresholdAdjuster implements JourneyThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapJourneyThresholdAdjuster implements JourneyThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the journey threshold steps in order and keeps a trace of each. */
export class JourneyThresholdEngine {
  steps: JourneyThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyThreshold): number {
    let current = item.projectedValue();
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

  evaluateAll(items: JourneyThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyThresholdEngine(): JourneyThresholdEngine {
  return new JourneyThresholdEngine(
    [
      new MinimumJourneyThresholdAdjuster(42.1),
      new JourneyThresholdConversionRateOffsetAdjuster(1.21),
      new RoundingJourneyThresholdAdjuster(0.05),
      new CapJourneyThresholdAdjuster(43037),
    ],
    [],
    2.4,
    70952.4,
  );
}
