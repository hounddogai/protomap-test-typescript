import * as numbers from "../../../../kit/numbers.js";
import { FunnelDraft } from "./funnel-draft.js";

/** One step of the funnel draft calculation. */
export interface FunnelDraftModifier {
  describe(): string;
  adjust(item: FunnelDraft, value: number): number;
}

export class MinimumFunnelDraftAdjuster implements FunnelDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFunnelDraftAdjuster implements FunnelDraftModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFunnelDraftAdjuster implements FunnelDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitFunnelDraftAdjuster implements FunnelDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: FunnelDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFunnelDraftAdjuster implements FunnelDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel draft steps in order and keeps a trace of each. */
export class FunnelDraftEngine {
  steps: FunnelDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelDraft): number {
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

  evaluateAll(items: FunnelDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelDraftEngine(): FunnelDraftEngine {
  return new FunnelDraftEngine(
    [
      new MinimumFunnelDraftAdjuster(30.5),
      new RoundingFunnelDraftAdjuster(0.1),
      new PercentFunnelDraftAdjuster(8.8),
      new UnitFunnelDraftAdjuster(new Map<string, number>([["south", 1.34], ["west", 1.11]])),
      new CapFunnelDraftAdjuster(19417),
    ],
    [],
    1.6,
    66961.6,
  );
}
