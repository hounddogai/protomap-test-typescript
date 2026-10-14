import * as numbers from "../../../../kit/numbers.js";
import { LenientWarmupDraft } from "./lenient-warmup-draft.js";

/** One step of the lenient warmup draft calculation. */
export interface LenientWarmupDraftAdjuster {
  describe(): string;
  adjust(item: LenientWarmupDraft, value: number): number;
}

export class UtmSourceLenientWarmupDraftAdjuster implements LenientWarmupDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: LenientWarmupDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientWarmupDraftAdjuster implements LenientWarmupDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientWarmupDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLenientWarmupDraftAdjuster implements LenientWarmupDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientWarmupDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientWarmupDraftAdjuster implements LenientWarmupDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientWarmupDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientWarmupDraftAdjuster implements LenientWarmupDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientWarmupDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient warmup draft steps in order and keeps a trace of each. */
export class LenientWarmupDraftEngine {
  steps: LenientWarmupDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientWarmupDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientWarmupDraft): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LenientWarmupDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientWarmupDraftEngine(): LenientWarmupDraftEngine {
  return new LenientWarmupDraftEngine(
    [
      new UtmSourceLenientWarmupDraftAdjuster(
        new Map<string, number>([["central", 0.94], ["east", 0.76], ["south", 1.21]]),
      ),
      new RoundingLenientWarmupDraftAdjuster(1),
      new CapLenientWarmupDraftAdjuster(3902),
      new MinimumLenientWarmupDraftAdjuster(27.3),
      new PercentLenientWarmupDraftAdjuster(1.6),
    ],
    [],
    2.2,
    45441.9,
  );
}
