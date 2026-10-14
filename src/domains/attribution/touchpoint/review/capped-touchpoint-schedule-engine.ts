import * as numbers from "../../../../kit/numbers.js";
import { CappedTouchpointSchedule } from "./capped-touchpoint-schedule.js";

/** One step of the capped touchpoint schedule calculation. */
export interface CappedTouchpointScheduleFactor {
  describe(): string;
  adjust(item: CappedTouchpointSchedule, value: number): number;
}

export class PercentCappedTouchpointScheduleAdjuster implements CappedTouchpointScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedTouchpointSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedTouchpointScheduleAdjuster implements CappedTouchpointScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedTouchpointSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelCappedTouchpointScheduleAdjuster implements CappedTouchpointScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CappedTouchpointSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped touchpoint schedule steps in order and keeps a trace of each. */
export class CappedTouchpointScheduleEngine {
  steps: CappedTouchpointScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedTouchpointScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedTouchpointSchedule): number {
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

  evaluateAll(items: CappedTouchpointSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedTouchpointScheduleEngine(): CappedTouchpointScheduleEngine {
  return new CappedTouchpointScheduleEngine(
    [
      new PercentCappedTouchpointScheduleAdjuster(-23.6),
      new MinimumCappedTouchpointScheduleAdjuster(18),
      new ChannelCappedTouchpointScheduleAdjuster(new Map<string, number>([["online", 1.38]])),
    ],
    [],
    3.8,
    92095.9,
  );
}
