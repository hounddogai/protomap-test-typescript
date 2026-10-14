import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualPathReview } from "./manual-path-review.js";

/** One step of the manual path review calculation. */
export interface ManualPathReviewFactor {
  describe(): string;
  adjust(item: ManualPathReview, value: number): number;
}

export class FlaggedManualPathReviewAdjuster implements ManualPathReviewFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ManualPathReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualPathReviewAdjuster implements ManualPathReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPathReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualPathReviewAdjuster implements ManualPathReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPathReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredManualPathReviewAdjuster implements ManualPathReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPathReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleManualPathReviewAdjuster implements ManualPathReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualPathReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual path review steps in order and keeps a trace of each. */
export class ManualPathReviewEngine {
  steps: ManualPathReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPathReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualPathReview): number {
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

  evaluateAll(items: ManualPathReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualPathReviewEngine(flagsValue: flags.Registry): ManualPathReviewEngine {
  return new ManualPathReviewEngine(
    [
      new FlaggedManualPathReviewAdjuster(flagsValue, "manual-path-review-primary", -2.3),
      new CapManualPathReviewAdjuster(35227),
      new RoundingManualPathReviewAdjuster(5),
      new TieredManualPathReviewAdjuster([7023, 7112, 7313, 8051], [1.16, 0.96, 1.03, 0.89]),
      new TitleManualPathReviewAdjuster(new Map<string, number>([["east", 1.28], ["north", 0.88]])),
    ],
    [],
    2.3,
    24458.4,
  );
}
