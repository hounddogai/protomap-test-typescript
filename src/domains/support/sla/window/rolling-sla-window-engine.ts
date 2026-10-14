import * as numbers from "../../../../kit/numbers.js";
import { RollingSlaWindow } from "./rolling-sla-window.js";

/** One step of the rolling sla window calculation. */
export interface RollingSlaWindowFactor {
  describe(): string;
  adjust(item: RollingSlaWindow, value: number): number;
}

export class RollingSlaWindowAmountOffsetAdjuster implements RollingSlaWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: RollingSlaWindow, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class PercentRollingSlaWindowAdjuster implements RollingSlaWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingSlaWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingSlaWindowAdjuster implements RollingSlaWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingSlaWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling sla window steps in order and keeps a trace of each. */
export class RollingSlaWindowEngine {
  steps: RollingSlaWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingSlaWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingSlaWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingSlaWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingSlaWindowEngine(): RollingSlaWindowEngine {
  return new RollingSlaWindowEngine(
    [
      new RollingSlaWindowAmountOffsetAdjuster(1.17),
      new PercentRollingSlaWindowAdjuster(-15.4),
      new RoundingRollingSlaWindowAdjuster(0.1),
    ],
    [],
    1.8,
    80923,
  );
}
