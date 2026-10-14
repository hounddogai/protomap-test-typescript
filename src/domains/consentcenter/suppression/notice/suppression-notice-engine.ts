import * as numbers from "../../../../kit/numbers.js";
import { SuppressionNotice } from "./suppression-notice.js";

/** One step of the suppression notice calculation. */
export interface SuppressionNoticeAdjuster {
  describe(): string;
  adjust(item: SuppressionNotice, value: number): number;
}

export class MinimumSuppressionNoticeAdjuster implements SuppressionNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SuppressionNoticeDurationMinutesOffsetAdjuster implements SuppressionNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: SuppressionNotice, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class PercentSuppressionNoticeAdjuster implements SuppressionNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression notice steps in order and keeps a trace of each. */
export class SuppressionNoticeEngine {
  steps: SuppressionNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SuppressionNotice): number {
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

  evaluateAll(items: SuppressionNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSuppressionNoticeEngine(): SuppressionNoticeEngine {
  return new SuppressionNoticeEngine(
    [
      new MinimumSuppressionNoticeAdjuster(20.2),
      new SuppressionNoticeDurationMinutesOffsetAdjuster(1.24),
      new PercentSuppressionNoticeAdjuster(-3.9),
    ],
    [],
    1,
    32511.1,
  );
}
