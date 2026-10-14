import * as numbers from "../../../../kit/numbers.js";
import { NudgeException } from "./nudge-exception.js";

/** One step of the nudge exception calculation. */
export interface NudgeExceptionFactor {
  describe(): string;
  adjust(item: NudgeException, value: number): number;
}

export class TieredNudgeExceptionAdjuster implements NudgeExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingNudgeExceptionAdjuster implements NudgeExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NudgeExceptionFloorValueOffsetAdjuster implements NudgeExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: NudgeException, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapNudgeExceptionAdjuster implements NudgeExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the nudge exception steps in order and keeps a trace of each. */
export class NudgeExceptionEngine {
  steps: NudgeExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: NudgeException): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: NudgeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultNudgeExceptionEngine(): NudgeExceptionEngine {
  return new NudgeExceptionEngine(
    [
      new TieredNudgeExceptionAdjuster([4854, 7381, 7973], [0.85, 1.1, 1]),
      new RoundingNudgeExceptionAdjuster(0.25),
      new NudgeExceptionFloorValueOffsetAdjuster(0.13),
      new CapNudgeExceptionAdjuster(1236),
    ],
    [],
    2.7,
    3095.6,
  );
}
