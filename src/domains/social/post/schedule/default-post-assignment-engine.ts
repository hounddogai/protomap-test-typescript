import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPostAssignment } from "./default-post-assignment.js";

/** One step of the default post assignment calculation. */
export interface DefaultPostAssignmentAdjuster {
  describe(): string;
  adjust(item: DefaultPostAssignment, value: number): number;
}

export class FlaggedDefaultPostAssignmentAdjuster implements DefaultPostAssignmentAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: DefaultPostAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultPostAssignmentAdjuster implements DefaultPostAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPostAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultPostAssignmentAdjuster implements DefaultPostAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPostAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingDefaultPostAssignmentAdjuster implements DefaultPostAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPostAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDefaultPostAssignmentAdjuster implements DefaultPostAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPostAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default post assignment steps in order and keeps a trace of each. */
export class DefaultPostAssignmentEngineExtra {
  steps: DefaultPostAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPostAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultPostAssignment): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DefaultPostAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultPostAssignmentEngine(flagsValue: flags.Registry): DefaultPostAssignmentEngineExtra {
  return new DefaultPostAssignmentEngineExtra(
    [
      new FlaggedDefaultPostAssignmentAdjuster(flagsValue, "default-post-assignment-primary", 3.3),
      new PercentDefaultPostAssignmentAdjuster(10.4),
      new MinimumDefaultPostAssignmentAdjuster(16.8),
      new RoundingDefaultPostAssignmentAdjuster(0.1),
      new CapDefaultPostAssignmentAdjuster(42142),
    ],
    [],
    4.6,
    53499.7,
  );
}
