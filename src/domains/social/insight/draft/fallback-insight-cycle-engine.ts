import * as numbers from "../../../../kit/numbers.js";
import { FallbackInsightCycle } from "./fallback-insight-cycle.js";

/** One step of the fallback insight cycle calculation. */
export interface FallbackInsightCycleStep {
  describe(): string;
  adjust(item: FallbackInsightCycle, value: number): number;
}

export class PercentFallbackInsightCycleAdjuster implements FallbackInsightCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackInsightCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackInsightCycleAdjuster implements FallbackInsightCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackInsightCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackInsightCycleScoreOffsetAdjuster implements FallbackInsightCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: FallbackInsightCycle, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the fallback insight cycle steps in order and keeps a trace of each. */
export class FallbackInsightCycleEngine {
  steps: FallbackInsightCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackInsightCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackInsightCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackInsightCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackInsightCycleEngine(): FallbackInsightCycleEngine {
  return new FallbackInsightCycleEngine(
    [
      new PercentFallbackInsightCycleAdjuster(-24.1),
      new CapFallbackInsightCycleAdjuster(9035),
      new FallbackInsightCycleScoreOffsetAdjuster(1.61),
    ],
    [],
    4.4,
    23382.1,
  );
}
