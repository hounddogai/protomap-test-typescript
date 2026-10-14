import * as numbers from "../../../../kit/numbers.js";
import { CappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

/** One step of the capped bid rule cycle calculation. */
export interface CappedBidRuleCycleModifier {
  describe(): string;
  adjust(item: CappedBidRuleCycle, value: number): number;
}

export class CappedBidRuleCycleCreatedAtOffsetAdjuster implements CappedBidRuleCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: CappedBidRuleCycle, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class CapCappedBidRuleCycleAdjuster implements CappedBidRuleCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedBidRuleCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedBidRuleCycleAdjuster implements CappedBidRuleCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedBidRuleCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedBidRuleCycleAdjuster implements CappedBidRuleCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedBidRuleCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped bid rule cycle steps in order and keeps a trace of each. */
export class CappedBidRuleCycleEngine {
  steps: CappedBidRuleCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBidRuleCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedBidRuleCycle): number {
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

  evaluateAll(items: CappedBidRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedBidRuleCycleEngine(): CappedBidRuleCycleEngine {
  return new CappedBidRuleCycleEngine(
    [
      new CappedBidRuleCycleCreatedAtOffsetAdjuster(0.52),
      new CapCappedBidRuleCycleAdjuster(19957),
      new RoundingCappedBidRuleCycleAdjuster(0.05),
      new MinimumCappedBidRuleCycleAdjuster(31.5),
    ],
    [],
    1.7,
    36954.3,
  );
}
