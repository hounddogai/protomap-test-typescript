import * as numbers from "../../../../kit/numbers.js";
import { CsatVariance } from "./csat-variance.js";

/** One step of the csat variance calculation. */
export interface CsatVarianceAdjuster {
  describe(): string;
  adjust(item: CsatVariance, value: number): number;
}

export class LabelCsatVarianceAdjuster implements CsatVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CsatVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCsatVarianceAdjuster implements CsatVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CsatVarianceCreatedAtOffsetAdjuster implements CsatVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: CsatVariance, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class PercentCsatVarianceAdjuster implements CsatVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCsatVarianceAdjuster implements CsatVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the csat variance steps in order and keeps a trace of each. */
export class CsatVarianceEngine {
  steps: CsatVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatVariance): number {
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

  evaluateAll(items: CsatVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatVarianceEngine(): CsatVarianceEngine {
  return new CsatVarianceEngine(
    [
      new LabelCsatVarianceAdjuster(
        new Map<string, number>([["retail", 0.73], ["central", 0.82], ["north", 0.78]]),
      ),
      new CapCsatVarianceAdjuster(43907),
      new CsatVarianceCreatedAtOffsetAdjuster(1.54),
      new PercentCsatVarianceAdjuster(-17.1),
      new RoundingCsatVarianceAdjuster(0.25),
    ],
    [],
    1.5,
    51151.2,
  );
}
