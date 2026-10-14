import * as numbers from "../../../../kit/numbers.js";
import { CappedWarmupDraft } from "./capped-warmup-draft.js";

/** One step of the capped warmup draft calculation. */
export interface CappedWarmupDraftModifier {
  describe(): string;
  adjust(item: CappedWarmupDraft, value: number): number;
}

export class MinimumCappedWarmupDraftAdjuster implements CappedWarmupDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedWarmupDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameCappedWarmupDraftAdjuster implements CappedWarmupDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedWarmupDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedWarmupDraftAdjuster implements CappedWarmupDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedWarmupDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCappedWarmupDraftAdjuster implements CappedWarmupDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedWarmupDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped warmup draft steps in order and keeps a trace of each. */
export class CappedWarmupDraftEngine {
  steps: CappedWarmupDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedWarmupDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedWarmupDraft): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: CappedWarmupDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedWarmupDraftEngine(): CappedWarmupDraftEngine {
  return new CappedWarmupDraftEngine(
    [
      new MinimumCappedWarmupDraftAdjuster(23.1),
      new NameCappedWarmupDraftAdjuster(
        new Map<string, number>([["east", 1.08], ["online", 0.93], ["north", 1.16]]),
      ),
      new CapCappedWarmupDraftAdjuster(46060),
      new PercentCappedWarmupDraftAdjuster(19),
    ],
    [],
    3.6,
    36330.2,
  );
}
