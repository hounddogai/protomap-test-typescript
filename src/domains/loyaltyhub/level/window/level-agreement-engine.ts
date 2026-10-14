import * as numbers from "../../../../kit/numbers.js";
import { LevelAgreement } from "./level-agreement.js";

/** One step of the level agreement calculation. */
export interface LevelAgreementStep {
  describe(): string;
  adjust(item: LevelAgreement, value: number): number;
}

export class RoundingLevelAgreementAdjuster implements LevelAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLevelAgreementAdjuster implements LevelAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LevelAgreementPriorityOffsetAdjuster implements LevelAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: LevelAgreement, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the level agreement steps in order and keeps a trace of each. */
export class LevelAgreementEngine {
  steps: LevelAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LevelAgreement): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LevelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLevelAgreementEngine(): LevelAgreementEngine {
  return new LevelAgreementEngine(
    [
      new RoundingLevelAgreementAdjuster(1),
      new MinimumLevelAgreementAdjuster(10.1),
      new LevelAgreementPriorityOffsetAdjuster(1.15),
    ],
    [],
    3.4,
    55256.7,
  );
}
