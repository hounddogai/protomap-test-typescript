import { CreativeRule } from "./creative-rule.js";

/** One step of the creative rule calculation. */
export interface CreativeRuleFactor {
  describe(): string;
  adjust(item: CreativeRule, value: number): number;
}

export class CapCreativeRuleAdjuster implements CreativeRuleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCreativeRuleAdjuster implements CreativeRuleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CreativeRuleCreatedAtOffsetAdjuster implements CreativeRuleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: CreativeRule, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the creative rule steps in order and keeps a trace of each. */
export class CreativeRuleEngine {
  steps: CreativeRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeRule): number {
    let current = item.netTotal();
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

  evaluateAll(items: CreativeRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeRuleEngine(): CreativeRuleEngine {
  return new CreativeRuleEngine(
    [
      new CapCreativeRuleAdjuster(37317),
      new PercentCreativeRuleAdjuster(-12),
      new CreativeRuleCreatedAtOffsetAdjuster(1.35),
    ],
    [],
    4.9,
    15434.3,
  );
}
