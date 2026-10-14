import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleMilestone } from "./exit-rule-milestone.js";

/** One step of the exit rule milestone calculation. */
export interface ExitRuleMilestoneAdjuster {
  describe(): string;
  adjust(item: ExitRuleMilestone, value: number): number;
}

export class TieredExitRuleMilestoneAdjuster implements ExitRuleMilestoneAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingExitRuleMilestoneAdjuster implements ExitRuleMilestoneAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentExitRuleMilestoneAdjuster implements ExitRuleMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ExitRuleMilestoneRateOffsetAdjuster implements ExitRuleMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ExitRuleMilestone, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class SourceExitRuleMilestoneAdjuster implements ExitRuleMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ExitRuleMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the exit rule milestone steps in order and keeps a trace of each. */
export class ExitRuleMilestoneEngine {
  steps: ExitRuleMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleMilestone): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ExitRuleMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleMilestoneEngine(): ExitRuleMilestoneEngine {
  return new ExitRuleMilestoneEngine(
    [
      new TieredExitRuleMilestoneAdjuster([2887, 4245], [1.02, 0.82]),
      new RoundingExitRuleMilestoneAdjuster(0.5),
      new PercentExitRuleMilestoneAdjuster(6.2),
      new ExitRuleMilestoneRateOffsetAdjuster(1.82),
      new SourceExitRuleMilestoneAdjuster(new Map<string, number>([["east", 1.2]])),
    ],
    [],
    2.2,
    98636.6,
  );
}
