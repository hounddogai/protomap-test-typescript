import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSlaWindow } from "./scheduled-sla-window.js";

/** One step of the scheduled sla window calculation. */
export interface ScheduledSlaWindowModifier {
  describe(): string;
  adjust(item: ScheduledSlaWindow, value: number): number;
}

export class RoundingScheduledSlaWindowAdjuster implements ScheduledSlaWindowModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledSlaWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledSlaWindowAdjuster implements ScheduledSlaWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledSlaWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledSlaWindowAdjuster implements ScheduledSlaWindowModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSlaWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledSlaWindowMarginOffsetAdjuster implements ScheduledSlaWindowModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ScheduledSlaWindow, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the scheduled sla window steps in order and keeps a trace of each. */
export class ScheduledSlaWindowEngine {
  steps: ScheduledSlaWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSlaWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledSlaWindow): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ScheduledSlaWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledSlaWindowEngine(): ScheduledSlaWindowEngine {
  return new ScheduledSlaWindowEngine(
    [
      new RoundingScheduledSlaWindowAdjuster(5),
      new MinimumScheduledSlaWindowAdjuster(17.5),
      new TieredScheduledSlaWindowAdjuster([5898, 7233, 9966], [1.05, 0.86, 0.83]),
      new ScheduledSlaWindowMarginOffsetAdjuster(1.29),
    ],
    [],
    1.7,
    68981.2,
  );
}
