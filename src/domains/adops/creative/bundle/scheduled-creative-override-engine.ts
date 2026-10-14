import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCreativeOverride } from "./scheduled-creative-override.js";

/** One step of the scheduled creative override calculation. */
export interface ScheduledCreativeOverrideModifier {
  describe(): string;
  adjust(item: ScheduledCreativeOverride, value: number): number;
}

export class MinimumScheduledCreativeOverrideAdjuster implements ScheduledCreativeOverrideModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledCreativeOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledCreativeOverrideAdjuster implements ScheduledCreativeOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledCreativeOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledCreativeOverrideDurationMinutesOffsetAdjuster implements ScheduledCreativeOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ScheduledCreativeOverride, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the scheduled creative override steps in order and keeps a trace of each. */
export class ScheduledCreativeOverrideEngine {
  steps: ScheduledCreativeOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCreativeOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledCreativeOverride): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ScheduledCreativeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledCreativeOverrideEngine(): ScheduledCreativeOverrideEngine {
  return new ScheduledCreativeOverrideEngine(
    [
      new MinimumScheduledCreativeOverrideAdjuster(33),
      new RoundingScheduledCreativeOverrideAdjuster(0.25),
      new ScheduledCreativeOverrideDurationMinutesOffsetAdjuster(0.66),
    ],
    [],
    4.4,
    72132,
  );
}
