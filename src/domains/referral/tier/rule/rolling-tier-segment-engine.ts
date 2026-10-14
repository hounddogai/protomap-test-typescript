import * as numbers from "../../../../kit/numbers.js";
import { RollingTierSegment } from "./rolling-tier-segment.js";

/** One step of the rolling tier segment calculation. */
export interface RollingTierSegmentFactor {
  describe(): string;
  adjust(item: RollingTierSegment, value: number): number;
}

export class PercentRollingTierSegmentAdjuster implements RollingTierSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingTierSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingTierSegmentAdjuster implements RollingTierSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingTierSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingTierSegmentAdjuster implements RollingTierSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingTierSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling tier segment steps in order and keeps a trace of each. */
export class RollingTierSegmentEngine {
  steps: RollingTierSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingTierSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingTierSegment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RollingTierSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingTierSegmentEngine(): RollingTierSegmentEngine {
  return new RollingTierSegmentEngine(
    [
      new PercentRollingTierSegmentAdjuster(-11.5),
      new MinimumRollingTierSegmentAdjuster(25.6),
      new RoundingRollingTierSegmentAdjuster(1),
    ],
    [],
    3.3,
    60373.2,
  );
}
