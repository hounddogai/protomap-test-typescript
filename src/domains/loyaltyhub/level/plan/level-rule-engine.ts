import * as numbers from "../../../../kit/numbers.js";
import { LevelRule } from "./level-rule.js";

/** One step of the level rule calculation. */
export interface LevelRuleStep {
  describe(): string;
  adjust(item: LevelRule, value: number): number;
}

export class LevelRuleStartsAtOffsetAdjuster implements LevelRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: LevelRule, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class MinimumLevelRuleAdjuster implements LevelRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLevelRuleAdjuster implements LevelRuleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the level rule steps in order and keeps a trace of each. */
export class LevelRuleEngine {
  steps: LevelRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelRule): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LevelRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelRuleEngine(): LevelRuleEngine {
  return new LevelRuleEngine(
    [
      new LevelRuleStartsAtOffsetAdjuster(0.69),
      new MinimumLevelRuleAdjuster(34.2),
      new TieredLevelRuleAdjuster([4568, 6066, 9736], [0.93, 0.99, 0.81]),
    ],
    [],
    1,
    19236.7,
  );
}
