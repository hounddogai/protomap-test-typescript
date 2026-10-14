import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleMapping } from "./exit-rule-mapping.js";

/** One step of the exit rule mapping calculation. */
export interface ExitRuleMappingFactor {
  describe(): string;
  adjust(item: ExitRuleMapping, value: number): number;
}

export class TitleExitRuleMappingAdjuster implements ExitRuleMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ExitRuleMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentExitRuleMappingAdjuster implements ExitRuleMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingExitRuleMappingAdjuster implements ExitRuleMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the exit rule mapping steps in order and keeps a trace of each. */
export class ExitRuleMappingEngine {
  steps: ExitRuleMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleMapping): number {
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

  evaluateAll(items: ExitRuleMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleMappingEngine(): ExitRuleMappingEngine {
  return new ExitRuleMappingEngine(
    [
      new TitleExitRuleMappingAdjuster(new Map<string, number>([["retail", 1]])),
      new PercentExitRuleMappingAdjuster(-4.8),
      new RoundingExitRuleMappingAdjuster(0.25),
    ],
    [],
    1.5,
    2253.3,
  );
}
