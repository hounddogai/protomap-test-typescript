import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

/** One step of the exit rule checkpoint calculation. */
export interface ExitRuleCheckpointModifier {
  describe(): string;
  adjust(item: ExitRuleCheckpoint, value: number): number;
}

export class CapExitRuleCheckpointAdjuster implements ExitRuleCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleCheckpointAdjuster implements ExitRuleCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumExitRuleCheckpointAdjuster implements ExitRuleCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingExitRuleCheckpointAdjuster implements ExitRuleCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleExitRuleCheckpointAdjuster implements ExitRuleCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ExitRuleCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the exit rule checkpoint steps in order and keeps a trace of each. */
export class ExitRuleCheckpointEngine {
  steps: ExitRuleCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ExitRuleCheckpoint): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ExitRuleCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultExitRuleCheckpointEngine(): ExitRuleCheckpointEngine {
  return new ExitRuleCheckpointEngine(
    [
      new CapExitRuleCheckpointAdjuster(11195),
      new PercentExitRuleCheckpointAdjuster(-23.2),
      new MinimumExitRuleCheckpointAdjuster(12.8),
      new RoundingExitRuleCheckpointAdjuster(0.5),
      new TitleExitRuleCheckpointAdjuster(
        new Map<string, number>([["north", 0.89], ["retail", 1.34], ["central", 0.88]]),
      ),
    ],
    [],
    2.5,
    95162.9,
  );
}
