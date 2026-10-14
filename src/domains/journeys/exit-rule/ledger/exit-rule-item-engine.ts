import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleItem } from "./exit-rule-item.js";

/** One step of the exit rule item calculation. */
export interface ExitRuleItemModifier {
  describe(): string;
  adjust(item: ExitRuleItem, value: number): number;
}

export class LabelExitRuleItemAdjuster implements ExitRuleItemModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ExitRuleItem, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ExitRuleItemCreatedAtOffsetAdjuster implements ExitRuleItemModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ExitRuleItem, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingExitRuleItemAdjuster implements ExitRuleItemModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleItem, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the exit rule item steps in order and keeps a trace of each. */
export class ExitRuleItemEngine {
  steps: ExitRuleItemModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleItemModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ExitRuleItem): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ExitRuleItem[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultExitRuleItemEngine(): ExitRuleItemEngine {
  return new ExitRuleItemEngine(
    [
      new LabelExitRuleItemAdjuster(new Map<string, number>([["online", 1.23], ["east", 0.98]])),
      new ExitRuleItemCreatedAtOffsetAdjuster(0.58),
      new RoundingExitRuleItemAdjuster(0.25),
    ],
    [],
    4.3,
    14123.1,
  );
}
