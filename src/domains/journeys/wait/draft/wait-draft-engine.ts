import * as numbers from "../../../../kit/numbers.js";
import { WaitDraft } from "./wait-draft.js";

/** One step of the wait draft calculation. */
export interface WaitDraftAdjuster {
  describe(): string;
  adjust(item: WaitDraft, value: number): number;
}

export class PercentWaitDraftAdjuster implements WaitDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWaitDraftAdjuster implements WaitDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleWaitDraftAdjuster implements WaitDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WaitDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWaitDraftAdjuster implements WaitDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the wait draft steps in order and keeps a trace of each. */
export class WaitDraftEngine {
  steps: WaitDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitDraft): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WaitDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitDraftEngine(): WaitDraftEngine {
  return new WaitDraftEngine(
    [
      new PercentWaitDraftAdjuster(-10.4),
      new RoundingWaitDraftAdjuster(0.5),
      new TitleWaitDraftAdjuster(new Map<string, number>([["west", 0.84]])),
      new TieredWaitDraftAdjuster([1789, 9924], [0.84, 0.82]),
    ],
    [],
    4.4,
    55495.7,
  );
}
