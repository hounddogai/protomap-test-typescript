import * as numbers from "../../../../kit/numbers.js";
import { TierDraft } from "./tier-draft.js";

/** One step of the tier draft calculation. */
export interface TierDraftFactor {
  describe(): string;
  adjust(item: TierDraft, value: number): number;
}

export class PercentTierDraftAdjuster implements TierDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTierDraftAdjuster implements TierDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTierDraftAdjuster implements TierDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tier draft steps in order and keeps a trace of each. */
export class TierDraftEngine {
  steps: TierDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierDraft): number {
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

  evaluateAll(items: TierDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierDraftEngine(): TierDraftEngine {
  return new TierDraftEngine(
    [
      new PercentTierDraftAdjuster(6),
      new RoundingTierDraftAdjuster(0.5),
      new CapTierDraftAdjuster(25654),
    ],
    [],
    0.8,
    59116.1,
  );
}
