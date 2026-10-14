import * as numbers from "../../../../kit/numbers.js";
import { CappedNudgeEntry } from "./capped-nudge-entry.js";

/** One step of the capped nudge entry calculation. */
export interface CappedNudgeEntryFactor {
  describe(): string;
  adjust(item: CappedNudgeEntry, value: number): number;
}

export class CappedNudgeEntryThresholdOffsetAdjuster implements CappedNudgeEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CappedNudgeEntry, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CountryCappedNudgeEntryAdjuster implements CappedNudgeEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: CappedNudgeEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCappedNudgeEntryAdjuster implements CappedNudgeEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedNudgeEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedNudgeEntryAdjuster implements CappedNudgeEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedNudgeEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped nudge entry steps in order and keeps a trace of each. */
export class CappedNudgeEntryEngine {
  steps: CappedNudgeEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedNudgeEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedNudgeEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: CappedNudgeEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedNudgeEntryEngine(): CappedNudgeEntryEngine {
  return new CappedNudgeEntryEngine(
    [
      new CappedNudgeEntryThresholdOffsetAdjuster(1.57),
      new CountryCappedNudgeEntryAdjuster(new Map<string, number>([["online", 1.03]])),
      new MinimumCappedNudgeEntryAdjuster(39.2),
      new RoundingCappedNudgeEntryAdjuster(0.05),
    ],
    [],
    1.6,
    17159.6,
  );
}
