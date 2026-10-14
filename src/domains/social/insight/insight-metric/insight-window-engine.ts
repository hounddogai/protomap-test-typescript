import * as numbers from "../../../../kit/numbers.js";
import { InsightWindow } from "./insight-window.js";

/** One step of the insight window calculation. */
export interface InsightWindowStep {
  describe(): string;
  adjust(item: InsightWindow, value: number): number;
}

export class MinimumInsightWindowAdjuster implements InsightWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapInsightWindowAdjuster implements InsightWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class InsightWindowFrequencyCapOffsetAdjuster implements InsightWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: InsightWindow, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentInsightWindowAdjuster implements InsightWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight window steps in order and keeps a trace of each. */
export class InsightWindowEngine {
  steps: InsightWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightWindow): number {
    let current = item.projectedValue();
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

  evaluateAll(items: InsightWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightWindowEngine(): InsightWindowEngine {
  return new InsightWindowEngine(
    [
      new MinimumInsightWindowAdjuster(27.6),
      new CapInsightWindowAdjuster(39769),
      new InsightWindowFrequencyCapOffsetAdjuster(0.01),
      new PercentInsightWindowAdjuster(-15.5),
    ],
    [],
    0.7,
    8135,
  );
}
