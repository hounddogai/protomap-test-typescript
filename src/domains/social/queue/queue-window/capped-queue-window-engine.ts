import * as numbers from "../../../../kit/numbers.js";
import { CappedQueueWindow } from "./capped-queue-window.js";

/** One step of the capped queue window calculation. */
export interface CappedQueueWindowModifier {
  describe(): string;
  adjust(item: CappedQueueWindow, value: number): number;
}

export class CapCappedQueueWindowAdjuster implements CappedQueueWindowModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedQueueWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedQueueWindowRateOffsetAdjuster implements CappedQueueWindowModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: CappedQueueWindow, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentCappedQueueWindowAdjuster implements CappedQueueWindowModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedQueueWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedQueueWindowAdjuster implements CappedQueueWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedQueueWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedQueueWindowAdjuster implements CappedQueueWindowModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedQueueWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameCappedQueueWindowAdjuster implements CappedQueueWindowModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedQueueWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped queue window steps in order and keeps a trace of each. */
export class CappedQueueWindowEngine {
  steps: CappedQueueWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedQueueWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedQueueWindow): number {
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

  evaluateAll(items: CappedQueueWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedQueueWindowEngine(): CappedQueueWindowEngine {
  return new CappedQueueWindowEngine(
    [
      new CapCappedQueueWindowAdjuster(40885),
      new CappedQueueWindowRateOffsetAdjuster(1.1),
      new PercentCappedQueueWindowAdjuster(-10.5),
      new MinimumCappedQueueWindowAdjuster(44.5),
      new RoundingCappedQueueWindowAdjuster(1),
      new NameCappedQueueWindowAdjuster(new Map<string, number>([["retail", 1.17]])),
    ],
    [],
    4.7,
    26862.9,
  );
}
