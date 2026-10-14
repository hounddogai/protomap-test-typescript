import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelRule } from "./model-rule.js";

/** One step of the model rule calculation. */
export interface ModelRuleStep {
  describe(): string;
  adjust(item: ModelRule, value: number): number;
}

export class ModelRuleOpenRateOffsetAdjuster implements ModelRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ModelRule, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class CapModelRuleAdjuster implements ModelRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedModelRuleAdjuster implements ModelRuleStep {
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

  adjust(item: ModelRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameModelRuleAdjuster implements ModelRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ModelRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingModelRuleAdjuster implements ModelRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the model rule steps in order and keeps a trace of each. */
export class ModelRuleEngine {
  steps: ModelRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelRule): number {
    let current = item.netLoad();
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

  evaluateAll(items: ModelRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelRuleEngine(flagsValue: flags.Registry): ModelRuleEngine {
  return new ModelRuleEngine(
    [
      new ModelRuleOpenRateOffsetAdjuster(1.29),
      new CapModelRuleAdjuster(39885),
      new FlaggedModelRuleAdjuster(flagsValue, "model-rule-strict", 5.7),
      new NameModelRuleAdjuster(new Map<string, number>([["online", 1.05]])),
      new RoundingModelRuleAdjuster(0.25),
    ],
    [],
    3.5,
    89821.2,
  );
}
