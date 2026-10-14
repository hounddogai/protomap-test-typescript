import * as numbers from "../../../../kit/numbers.js";
import { RollingOptOutTier } from "./rolling-opt-out-tier.js";

/** One step of the rolling opt out tier calculation. */
export interface RollingOptOutTierModifier {
  describe(): string;
  adjust(item: RollingOptOutTier, value: number): number;
}

export class RoundingRollingOptOutTierAdjuster implements RollingOptOutTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingOptOutTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingOptOutTierDurationMinutesOffsetAdjuster implements RollingOptOutTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: RollingOptOutTier, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumRollingOptOutTierAdjuster implements RollingOptOutTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingOptOutTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling opt out tier steps in order and keeps a trace of each. */
export class RollingOptOutTierEngine {
  steps: RollingOptOutTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingOptOutTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingOptOutTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingOptOutTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingOptOutTierEngine(): RollingOptOutTierEngine {
  return new RollingOptOutTierEngine(
    [
      new RoundingRollingOptOutTierAdjuster(1),
      new RollingOptOutTierDurationMinutesOffsetAdjuster(1.88),
      new MinimumRollingOptOutTierAdjuster(6),
    ],
    [],
    1.7,
    73036.2,
  );
}
