import * as numbers from "../../../../kit/numbers.js";
import { RetentionNotice } from "./retention-notice.js";

/** One step of the retention notice calculation. */
export interface RetentionNoticeModifier {
  describe(): string;
  adjust(item: RetentionNotice, value: number): number;
}

export class RetentionNoticeCostOffsetAdjuster implements RetentionNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: RetentionNotice, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumRetentionNoticeAdjuster implements RetentionNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameRetentionNoticeAdjuster implements RetentionNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RetentionNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRetentionNoticeAdjuster implements RetentionNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRetentionNoticeAdjuster implements RetentionNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the retention notice steps in order and keeps a trace of each. */
export class RetentionNoticeEngine {
  steps: RetentionNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RetentionNotice): number {
    let current = item.netLoad();
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

  evaluateAll(items: RetentionNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRetentionNoticeEngine(): RetentionNoticeEngine {
  return new RetentionNoticeEngine(
    [
      new RetentionNoticeCostOffsetAdjuster(0.49),
      new MinimumRetentionNoticeAdjuster(22),
      new NameRetentionNoticeAdjuster(new Map<string, number>([["south", 1.11]])),
      new TieredRetentionNoticeAdjuster([338, 3534], [0.87, 1.15]),
      new RoundingRetentionNoticeAdjuster(1),
    ],
    [],
    1.2,
    52520.9,
  );
}
