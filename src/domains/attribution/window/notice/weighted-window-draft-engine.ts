import * as numbers from "../../../../kit/numbers.js";
import { WeightedWindowDraft } from "./weighted-window-draft.js";

/** One step of the weighted window draft calculation. */
export interface WeightedWindowDraftModifier {
  describe(): string;
  adjust(item: WeightedWindowDraft, value: number): number;
}

export class LabelWeightedWindowDraftAdjuster implements WeightedWindowDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedWindowDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedWindowDraftAdjuster implements WeightedWindowDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWindowDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWeightedWindowDraftAdjuster implements WeightedWindowDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWindowDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedWindowDraftAdjuster implements WeightedWindowDraftModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWindowDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted window draft steps in order and keeps a trace of each. */
export class WeightedWindowDraftEngine {
  steps: WeightedWindowDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWindowDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWindowDraft): number {
    let current = item.netValue();
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

  evaluateAll(items: WeightedWindowDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWindowDraftEngine(): WeightedWindowDraftEngine {
  return new WeightedWindowDraftEngine(
    [
      new LabelWeightedWindowDraftAdjuster(new Map<string, number>([["central", 0.91], ["east", 0.83]])),
      new CapWeightedWindowDraftAdjuster(39153),
      new PercentWeightedWindowDraftAdjuster(21.6),
      new RoundingWeightedWindowDraftAdjuster(0.5),
    ],
    [],
    3.2,
    85109.9,
  );
}
