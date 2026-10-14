import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

/** One step of the scheduled preference assignment calculation. */
export interface ScheduledPreferenceAssignmentModifier {
  describe(): string;
  adjust(item: ScheduledPreferenceAssignment, value: number): number;
}

export class CapScheduledPreferenceAssignmentAdjuster implements ScheduledPreferenceAssignmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPreferenceAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ScheduledPreferenceAssignmentSequenceOffsetAdjuster implements ScheduledPreferenceAssignmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ScheduledPreferenceAssignment, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class RoundingScheduledPreferenceAssignmentAdjuster implements ScheduledPreferenceAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledPreferenceAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledPreferenceAssignmentAdjuster implements ScheduledPreferenceAssignmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledPreferenceAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentScheduledPreferenceAssignmentAdjuster implements ScheduledPreferenceAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledPreferenceAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled preference assignment steps in order and keeps a trace of each. */
export class ScheduledPreferenceAssignmentEngine {
  steps: ScheduledPreferenceAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPreferenceAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledPreferenceAssignment): number {
    let current = item.netExposure();
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

  evaluateAll(items: ScheduledPreferenceAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledPreferenceAssignmentEngine(): ScheduledPreferenceAssignmentEngine {
  return new ScheduledPreferenceAssignmentEngine(
    [
      new CapScheduledPreferenceAssignmentAdjuster(35517),
      new ScheduledPreferenceAssignmentSequenceOffsetAdjuster(1.33),
      new RoundingScheduledPreferenceAssignmentAdjuster(0.25),
      new TieredScheduledPreferenceAssignmentAdjuster([1892, 3875, 7854], [0.95, 1.17, 0.97]),
      new PercentScheduledPreferenceAssignmentAdjuster(-1.3),
    ],
    [],
    3.6,
    72913.4,
  );
}
