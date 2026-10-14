import * as numbers from "../../../../kit/numbers.js";
import { WarmupRequest } from "./warmup-request.js";

/** One step of the warmup request calculation. */
export interface WarmupRequestFactor {
  describe(): string;
  adjust(item: WarmupRequest, value: number): number;
}

export class RoundingWarmupRequestAdjuster implements WarmupRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWarmupRequestAdjuster implements WarmupRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WarmupRequestRevisionOffsetAdjuster implements WarmupRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: WarmupRequest, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class PercentWarmupRequestAdjuster implements WarmupRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup request steps in order and keeps a trace of each. */
export class WarmupRequestEngine {
  steps: WarmupRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupRequest): number {
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

  evaluateAll(items: WarmupRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupRequestEngine(): WarmupRequestEngine {
  return new WarmupRequestEngine(
    [
      new RoundingWarmupRequestAdjuster(0.05),
      new MinimumWarmupRequestAdjuster(20.8),
      new WarmupRequestRevisionOffsetAdjuster(0.07),
      new PercentWarmupRequestAdjuster(-17.3),
    ],
    [],
    3.5,
    35170.4,
  );
}
