import * as numbers from "../../../../kit/numbers.js";
import { StrictTierDraft } from "./strict-tier-draft.js";

/** One step of the strict tier draft calculation. */
export interface StrictTierDraftStep {
  describe(): string;
  adjust(item: StrictTierDraft, value: number): number;
}

export class MinimumStrictTierDraftAdjuster implements StrictTierDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictTierDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictTierDraftAdjuster implements StrictTierDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictTierDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictTierDraftAdjuster implements StrictTierDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictTierDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameStrictTierDraftAdjuster implements StrictTierDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictTierDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict tier draft steps in order and keeps a trace of each. */
export class StrictTierDraftEngine {
  steps: StrictTierDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictTierDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictTierDraft): number {
    let current = item.netVolume();
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

  evaluateAll(items: StrictTierDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictTierDraftEngine(): StrictTierDraftEngine {
  return new StrictTierDraftEngine(
    [
      new MinimumStrictTierDraftAdjuster(0.1),
      new CapStrictTierDraftAdjuster(41304),
      new RoundingStrictTierDraftAdjuster(0.25),
      new NameStrictTierDraftAdjuster(new Map<string, number>([["retail", 1.07]])),
    ],
    [],
    0.2,
    11612.1,
  );
}
