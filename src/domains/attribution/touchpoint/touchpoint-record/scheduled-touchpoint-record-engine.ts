import * as numbers from "../../../../kit/numbers.js";
import { ScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

/** One step of the scheduled touchpoint record calculation. */
export interface ScheduledTouchpointRecordStep {
  describe(): string;
  adjust(item: ScheduledTouchpointRecord, value: number): number;
}

export class PercentScheduledTouchpointRecordAdjuster implements ScheduledTouchpointRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledTouchpointRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledTouchpointRecordScoreOffsetAdjuster implements ScheduledTouchpointRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ScheduledTouchpointRecord, value: number): number {
    return value + item.score * this.weight;
  }
}

export class RoundingScheduledTouchpointRecordAdjuster implements ScheduledTouchpointRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledTouchpointRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledTouchpointRecordAdjuster implements ScheduledTouchpointRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledTouchpointRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelScheduledTouchpointRecordAdjuster implements ScheduledTouchpointRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledTouchpointRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled touchpoint record steps in order and keeps a trace of each. */
export class ScheduledTouchpointRecordEngine {
  steps: ScheduledTouchpointRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledTouchpointRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledTouchpointRecord): number {
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

  evaluateAll(items: ScheduledTouchpointRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledTouchpointRecordEngine(): ScheduledTouchpointRecordEngine {
  return new ScheduledTouchpointRecordEngine(
    [
      new PercentScheduledTouchpointRecordAdjuster(0.6),
      new ScheduledTouchpointRecordScoreOffsetAdjuster(1.74),
      new RoundingScheduledTouchpointRecordAdjuster(5),
      new CapScheduledTouchpointRecordAdjuster(39496),
      new LabelScheduledTouchpointRecordAdjuster(new Map<string, number>([["west", 0.91]])),
    ],
    [],
    4.5,
    27668.5,
  );
}
