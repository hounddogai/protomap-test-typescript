import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

/** One step of the scheduled frequency notice calculation. */
export interface ScheduledFrequencyNoticeAdjuster {
  describe(): string;
  adjust(item: ScheduledFrequencyNotice, value: number): number;
}

export class SourceScheduledFrequencyNoticeAdjuster implements ScheduledFrequencyNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ScheduledFrequencyNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledFrequencyNoticeAdjuster implements ScheduledFrequencyNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFrequencyNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledFrequencyNoticeAdjuster implements ScheduledFrequencyNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFrequencyNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled frequency notice steps in order and keeps a trace of each. */
export class ScheduledFrequencyNoticeEngine {
  steps: ScheduledFrequencyNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFrequencyNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledFrequencyNotice): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ScheduledFrequencyNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledFrequencyNoticeEngine(): ScheduledFrequencyNoticeEngine {
  return new ScheduledFrequencyNoticeEngine(
    [
      new SourceScheduledFrequencyNoticeAdjuster(
        new Map<string, number>([["west", 1.01], ["online", 1.24], ["central", 0.78]]),
      ),
      new RoundingScheduledFrequencyNoticeAdjuster(0.5),
      new MinimumScheduledFrequencyNoticeAdjuster(4.4),
    ],
    [],
    0.8,
    10617.7,
  );
}
