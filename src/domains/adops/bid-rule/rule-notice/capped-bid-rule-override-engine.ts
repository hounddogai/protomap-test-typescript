import * as numbers from "../../../../kit/numbers.js";
import { CappedBidRuleOverride } from "./capped-bid-rule-override.js";

/** One step of the capped bid rule override calculation. */
export interface CappedBidRuleOverrideModifier {
  describe(): string;
  adjust(item: CappedBidRuleOverride, value: number): number;
}

export class RoundingCappedBidRuleOverrideAdjuster implements CappedBidRuleOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedBidRuleOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCappedBidRuleOverrideAdjuster implements CappedBidRuleOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedBidRuleOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedBidRuleOverrideRateOffsetAdjuster implements CappedBidRuleOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: CappedBidRuleOverride, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class NameCappedBidRuleOverrideAdjuster implements CappedBidRuleOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedBidRuleOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped bid rule override steps in order and keeps a trace of each. */
export class CappedBidRuleOverrideEngine {
  steps: CappedBidRuleOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBidRuleOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedBidRuleOverride): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: CappedBidRuleOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedBidRuleOverrideEngine(): CappedBidRuleOverrideEngine {
  return new CappedBidRuleOverrideEngine(
    [
      new RoundingCappedBidRuleOverrideAdjuster(1),
      new CapCappedBidRuleOverrideAdjuster(36611),
      new CappedBidRuleOverrideRateOffsetAdjuster(0.35),
      new NameCappedBidRuleOverrideAdjuster(new Map<string, number>([["north", 0.8]])),
    ],
    [],
    1.8,
    12381.6,
  );
}
