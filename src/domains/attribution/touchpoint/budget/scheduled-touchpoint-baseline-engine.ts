import * as numbers from "../../../../kit/numbers.js";
import { ScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

/** One step of the scheduled touchpoint baseline calculation. */
export interface ScheduledTouchpointBaselineModifier {
  describe(): string;
  adjust(item: ScheduledTouchpointBaseline, value: number): number;
}

export class CapScheduledTouchpointBaselineAdjuster implements ScheduledTouchpointBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledTouchpointBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledTouchpointBaselineAdjuster implements ScheduledTouchpointBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledTouchpointBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledTouchpointBaselineExpiresAtOffsetAdjuster implements ScheduledTouchpointBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: ScheduledTouchpointBaseline, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingScheduledTouchpointBaselineAdjuster implements ScheduledTouchpointBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledTouchpointBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled touchpoint baseline steps in order and keeps a trace of each. */
export class ScheduledTouchpointBaselineEngine {
  steps: ScheduledTouchpointBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledTouchpointBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledTouchpointBaseline): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ScheduledTouchpointBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledTouchpointBaselineEngine(): ScheduledTouchpointBaselineEngine {
  return new ScheduledTouchpointBaselineEngine(
    [
      new CapScheduledTouchpointBaselineAdjuster(14190),
      new PercentScheduledTouchpointBaselineAdjuster(-10.8),
      new ScheduledTouchpointBaselineExpiresAtOffsetAdjuster(0.61),
      new RoundingScheduledTouchpointBaselineAdjuster(0.1),
    ],
    [],
    2.4,
    14327.4,
  );
}
