import * as numbers from "../../../../kit/numbers.js";
import { CsatGroup } from "./csat-group.js";

/** One step of the csat group calculation. */
export interface CsatGroupAdjuster {
  describe(): string;
  adjust(item: CsatGroup, value: number): number;
}

export class PercentCsatGroupAdjuster implements CsatGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCsatGroupAdjuster implements CsatGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCsatGroupAdjuster implements CsatGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the csat group steps in order and keeps a trace of each. */
export class CsatGroupEngine {
  steps: CsatGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatGroup): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: CsatGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatGroupEngine(): CsatGroupEngine {
  return new CsatGroupEngine(
    [
      new PercentCsatGroupAdjuster(10.8),
      new MinimumCsatGroupAdjuster(23.9),
      new CapCsatGroupAdjuster(38690),
    ],
    [],
    2.2,
    7825.7,
  );
}
