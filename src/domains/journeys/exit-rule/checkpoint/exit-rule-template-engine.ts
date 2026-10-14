import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleTemplate } from "./exit-rule-template.js";

/** One step of the exit rule template calculation. */
export interface ExitRuleTemplateStep {
  describe(): string;
  adjust(item: ExitRuleTemplate, value: number): number;
}

export class CategoryExitRuleTemplateAdjuster implements ExitRuleTemplateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ExitRuleTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentExitRuleTemplateAdjuster implements ExitRuleTemplateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedExitRuleTemplateAdjuster implements ExitRuleTemplateStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ExitRuleTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule template steps in order and keeps a trace of each. */
export class ExitRuleTemplateEngine {
  steps: ExitRuleTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ExitRuleTemplate): number {
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

  evaluateAll(items: ExitRuleTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultExitRuleTemplateEngine(flagsValue: flags.Registry): ExitRuleTemplateEngine {
  return new ExitRuleTemplateEngine(
    [
      new CategoryExitRuleTemplateAdjuster(
        new Map<string, number>([["east", 1.05], ["central", 0.77], ["north", 1.38]]),
      ),
      new PercentExitRuleTemplateAdjuster(10.6),
      new FlaggedExitRuleTemplateAdjuster(flagsValue, "exit-rule-template-strict", 5.1),
    ],
    [],
    3,
    77131.1,
  );
}
