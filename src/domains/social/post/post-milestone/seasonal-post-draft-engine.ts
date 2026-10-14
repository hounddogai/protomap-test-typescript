import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPostDraft } from "./seasonal-post-draft.js";

/** One step of the seasonal post draft calculation. */
export interface SeasonalPostDraftModifier {
  describe(): string;
  adjust(item: SeasonalPostDraft, value: number): number;
}

export class TieredSeasonalPostDraftAdjuster implements SeasonalPostDraftModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalPostDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalPostDraftBudgetOffsetAdjuster implements SeasonalPostDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SeasonalPostDraft, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapSeasonalPostDraftAdjuster implements SeasonalPostDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalPostDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalPostDraftAdjuster implements SeasonalPostDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPostDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal post draft steps in order and keeps a trace of each. */
export class SeasonalPostDraftEngine {
  steps: SeasonalPostDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPostDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalPostDraft): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: SeasonalPostDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalPostDraftEngine(): SeasonalPostDraftEngine {
  return new SeasonalPostDraftEngine(
    [
      new TieredSeasonalPostDraftAdjuster([1066, 9452], [0.93, 1.1]),
      new SeasonalPostDraftBudgetOffsetAdjuster(1.05),
      new CapSeasonalPostDraftAdjuster(10059),
      new MinimumSeasonalPostDraftAdjuster(27.4),
    ],
    [],
    3.5,
    96490.3,
  );
}
