import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPathEntry } from "./scheduled-path-entry.js";

/** One step of the scheduled path entry calculation. */
export interface ScheduledPathEntryFactor {
  describe(): string;
  adjust(item: ScheduledPathEntry, value: number): number;
}

export class CapScheduledPathEntryAdjuster implements ScheduledPathEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPathEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameScheduledPathEntryAdjuster implements ScheduledPathEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledPathEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledPathEntryAdjuster implements ScheduledPathEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledPathEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledPathEntryExpiresAtOffsetAdjuster implements ScheduledPathEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: ScheduledPathEntry, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the scheduled path entry steps in order and keeps a trace of each. */
export class ScheduledPathEntryEngine {
  steps: ScheduledPathEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPathEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledPathEntry): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ScheduledPathEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledPathEntryEngine(): ScheduledPathEntryEngine {
  return new ScheduledPathEntryEngine(
    [
      new CapScheduledPathEntryAdjuster(41135),
      new NameScheduledPathEntryAdjuster(new Map<string, number>([["east", 1.29]])),
      new PercentScheduledPathEntryAdjuster(10.2),
      new ScheduledPathEntryExpiresAtOffsetAdjuster(0.39),
    ],
    [],
    3.9,
    84969.1,
  );
}
