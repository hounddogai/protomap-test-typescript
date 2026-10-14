import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

/** One step of the adaptive deflection score calculation. */
export interface AdaptiveDeflectionScoreAdjuster {
  describe(): string;
  adjust(item: AdaptiveDeflectionScore, value: number): number;
}

export class MinimumAdaptiveDeflectionScoreAdjuster implements AdaptiveDeflectionScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveDeflectionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveDeflectionScoreAdjuster implements AdaptiveDeflectionScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveDeflectionScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveDeflectionScoreAdjuster implements AdaptiveDeflectionScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDeflectionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptiveDeflectionScoreAdjuster implements AdaptiveDeflectionScoreAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveDeflectionScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive deflection score steps in order and keeps a trace of each. */
export class AdaptiveDeflectionScoreEngine {
  steps: AdaptiveDeflectionScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDeflectionScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveDeflectionScore): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: AdaptiveDeflectionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveDeflectionScoreEngine(): AdaptiveDeflectionScoreEngine {
  return new AdaptiveDeflectionScoreEngine(
    [
      new MinimumAdaptiveDeflectionScoreAdjuster(0.5),
      new CapAdaptiveDeflectionScoreAdjuster(31759),
      new RoundingAdaptiveDeflectionScoreAdjuster(1),
      new PercentAdaptiveDeflectionScoreAdjuster(-17.7),
    ],
    [],
    2.5,
    58725.1,
  );
}
