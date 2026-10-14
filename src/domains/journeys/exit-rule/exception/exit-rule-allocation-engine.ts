import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleAllocation } from "./exit-rule-allocation.js";

/** One step of the exit rule allocation calculation. */
export interface ExitRuleAllocationAdjuster {
  describe(): string;
  adjust(item: ExitRuleAllocation, value: number): number;
}

export class PercentExitRuleAllocationAdjuster implements ExitRuleAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ExitRuleAllocationFloorValueOffsetAdjuster implements ExitRuleAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ExitRuleAllocation, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class MinimumExitRuleAllocationAdjuster implements ExitRuleAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingExitRuleAllocationAdjuster implements ExitRuleAllocationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the exit rule allocation steps in order and keeps a trace of each. */
export class ExitRuleAllocationEngine {
  steps: ExitRuleAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleAllocation): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ExitRuleAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleAllocationEngine(): ExitRuleAllocationEngine {
  return new ExitRuleAllocationEngine(
    [
      new PercentExitRuleAllocationAdjuster(-10.4),
      new ExitRuleAllocationFloorValueOffsetAdjuster(1.54),
      new MinimumExitRuleAllocationAdjuster(14.5),
      new RoundingExitRuleAllocationAdjuster(0.5),
    ],
    [],
    0.3,
    32804.7,
  );
}
