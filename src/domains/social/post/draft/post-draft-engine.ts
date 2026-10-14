import * as numbers from "../../../../kit/numbers.js";
import { PostDraft } from "./post-draft.js";

/** One step of the post draft calculation. */
export interface PostDraftStep {
  describe(): string;
  adjust(item: PostDraft, value: number): number;
}

export class PercentPostDraftAdjuster implements PostDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPostDraftAdjuster implements PostDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocalePostDraftAdjuster implements PostDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PostDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPostDraftAdjuster implements PostDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the post draft steps in order and keeps a trace of each. */
export class PostDraftEngine {
  steps: PostDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostDraft): number {
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

  evaluateAll(items: PostDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostDraftEngine(): PostDraftEngine {
  return new PostDraftEngine(
    [
      new PercentPostDraftAdjuster(-21.3),
      new RoundingPostDraftAdjuster(0.5),
      new LocalePostDraftAdjuster(new Map<string, number>([["north", 1.28], ["retail", 0.76], ["south", 0.77]])),
      new CapPostDraftAdjuster(5152),
    ],
    [],
    0.8,
    61880.2,
  );
}
