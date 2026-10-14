import * as numbers from "../../../../kit/numbers.js";
import { ScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

/** One step of the scheduled nudge profile calculation. */
export interface ScheduledNudgeProfileModifier {
  describe(): string;
  adjust(item: ScheduledNudgeProfile, value: number): number;
}

export class PercentScheduledNudgeProfileAdjuster implements ScheduledNudgeProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledNudgeProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledNudgeProfileMinimumOffsetAdjuster implements ScheduledNudgeProfileModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ScheduledNudgeProfile, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class RoundingScheduledNudgeProfileAdjuster implements ScheduledNudgeProfileModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledNudgeProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledNudgeProfileAdjuster implements ScheduledNudgeProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledNudgeProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled nudge profile steps in order and keeps a trace of each. */
export class ScheduledNudgeProfileEngine {
  steps: ScheduledNudgeProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledNudgeProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledNudgeProfile): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ScheduledNudgeProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledNudgeProfileEngine(): ScheduledNudgeProfileEngine {
  return new ScheduledNudgeProfileEngine(
    [
      new PercentScheduledNudgeProfileAdjuster(-16.7),
      new ScheduledNudgeProfileMinimumOffsetAdjuster(1.62),
      new RoundingScheduledNudgeProfileAdjuster(0.25),
      new CapScheduledNudgeProfileAdjuster(1098),
    ],
    [],
    0.5,
    91979.4,
  );
}
