import * as numbers from "../../../../kit/numbers.js";
import { FunnelRule } from "./funnel-rule.js";

/** One step of the funnel rule calculation. */
export interface FunnelRuleModifier {
  describe(): string;
  adjust(item: FunnelRule, value: number): number;
}

export class SourceFunnelRuleAdjuster implements FunnelRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FunnelRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFunnelRuleAdjuster implements FunnelRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFunnelRuleAdjuster implements FunnelRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FunnelRuleBatchSizeOffsetAdjuster implements FunnelRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: FunnelRule, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class MinimumFunnelRuleAdjuster implements FunnelRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFunnelRuleAdjuster implements FunnelRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel rule steps in order and keeps a trace of each. */
export class FunnelRuleEngine {
  steps: FunnelRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelRule): number {
    let current = item.effectiveTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FunnelRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelRuleEngine(): FunnelRuleEngine {
  return new FunnelRuleEngine(
    [
      new SourceFunnelRuleAdjuster(
        new Map<string, number>([["retail", 1.12], ["central", 0.89], ["south", 1.1]]),
      ),
      new TieredFunnelRuleAdjuster([7752, 8276], [1.19, 1.2]),
      new RoundingFunnelRuleAdjuster(0.25),
      new FunnelRuleBatchSizeOffsetAdjuster(0.69),
      new MinimumFunnelRuleAdjuster(20.2),
      new CapFunnelRuleAdjuster(616),
    ],
    [],
    2.6,
    44618.4,
  );
}
