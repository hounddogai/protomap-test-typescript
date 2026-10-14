import * as numbers from "../../../../kit/numbers.js";
import { LevelWindow } from "./level-window.js";

/** One step of the level window calculation. */
export interface LevelWindowModifier {
  describe(): string;
  adjust(item: LevelWindow, value: number): number;
}

export class PercentLevelWindowAdjuster implements LevelWindowModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLevelWindowAdjuster implements LevelWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLevelWindowAdjuster implements LevelWindowModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the level window steps in order and keeps a trace of each. */
export class LevelWindowEngine {
  steps: LevelWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LevelWindow): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LevelWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLevelWindowEngine(): LevelWindowEngine {
  return new LevelWindowEngine(
    [
      new PercentLevelWindowAdjuster(6.7),
      new MinimumLevelWindowAdjuster(9.8),
      new RoundingLevelWindowAdjuster(1),
    ],
    [],
    2.3,
    36753.5,
  );
}
