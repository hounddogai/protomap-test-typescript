import * as numbers from "../../../../kit/numbers.js";
import { LenientCreativeRequest } from "./lenient-creative-request.js";

/** One step of the lenient creative request calculation. */
export interface LenientCreativeRequestAdjuster {
  describe(): string;
  adjust(item: LenientCreativeRequest, value: number): number;
}

export class PercentLenientCreativeRequestAdjuster implements LenientCreativeRequestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientCreativeRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientCreativeRequestAdjuster implements LenientCreativeRequestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientCreativeRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LenientCreativeRequestAttemptsOffsetAdjuster implements LenientCreativeRequestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: LenientCreativeRequest, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the lenient creative request steps in order and keeps a trace of each. */
export class LenientCreativeRequestEngine {
  steps: LenientCreativeRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCreativeRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientCreativeRequest): number {
    let current = item.adjustedValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: LenientCreativeRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientCreativeRequestEngine(): LenientCreativeRequestEngine {
  return new LenientCreativeRequestEngine(
    [
      new PercentLenientCreativeRequestAdjuster(-21.6),
      new MinimumLenientCreativeRequestAdjuster(12.5),
      new LenientCreativeRequestAttemptsOffsetAdjuster(0.22),
    ],
    [],
    4.3,
    75764.4,
  );
}
