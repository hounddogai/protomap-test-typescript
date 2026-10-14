import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleTarget } from "./exit-rule-target.js";

/** One step of the exit rule target calculation. */
export interface ExitRuleTargetAdjuster {
  describe(): string;
  adjust(item: ExitRuleTarget, value: number): number;
}

export class PercentExitRuleTargetAdjuster implements ExitRuleTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingExitRuleTargetAdjuster implements ExitRuleTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredExitRuleTargetAdjuster implements ExitRuleTargetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionExitRuleTargetAdjuster implements ExitRuleTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ExitRuleTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the exit rule target steps in order and keeps a trace of each. */
export class ExitRuleTargetEngine {
  steps: ExitRuleTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ExitRuleTarget): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ExitRuleTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultExitRuleTargetEngine(): ExitRuleTargetEngine {
  return new ExitRuleTargetEngine(
    [
      new PercentExitRuleTargetAdjuster(20.2),
      new RoundingExitRuleTargetAdjuster(0.1),
      new TieredExitRuleTargetAdjuster([5504, 6087, 7954], [0.8, 0.84, 1.03]),
      new RegionExitRuleTargetAdjuster(new Map<string, number>([["online", 1.17], ["central", 1.15]])),
    ],
    [],
    3,
    60452.6,
  );
}
