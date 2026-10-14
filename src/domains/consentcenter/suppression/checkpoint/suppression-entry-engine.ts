import * as numbers from "../../../../kit/numbers.js";
import { SuppressionEntry } from "./suppression-entry.js";

/** One step of the suppression entry calculation. */
export interface SuppressionEntryAdjuster {
  describe(): string;
  adjust(item: SuppressionEntry, value: number): number;
}

export class CapSuppressionEntryAdjuster implements SuppressionEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSuppressionEntryAdjuster implements SuppressionEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSuppressionEntryAdjuster implements SuppressionEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression entry steps in order and keeps a trace of each. */
export class SuppressionEntryEngine {
  steps: SuppressionEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SuppressionEntry): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SuppressionEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSuppressionEntryEngine(): SuppressionEntryEngine {
  return new SuppressionEntryEngine(
    [
      new CapSuppressionEntryAdjuster(10859),
      new RoundingSuppressionEntryAdjuster(0.25),
      new PercentSuppressionEntryAdjuster(-20.9),
    ],
    [],
    2.6,
    81767.6,
  );
}
