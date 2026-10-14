import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

/** One step of the weighted touchpoint assignment calculation. */
export interface WeightedTouchpointAssignmentModifier {
  describe(): string;
  adjust(item: WeightedTouchpointAssignment, value: number): number;
}

export class RoundingWeightedTouchpointAssignmentAdjuster implements WeightedTouchpointAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedTouchpointAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedTouchpointAssignmentAdjuster implements WeightedTouchpointAssignmentModifier {
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

  adjust(item: WeightedTouchpointAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedTouchpointAssignmentAdjuster implements WeightedTouchpointAssignmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedTouchpointAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWeightedTouchpointAssignmentAdjuster implements WeightedTouchpointAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedTouchpointAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted touchpoint assignment steps in order and keeps a trace of each. */
export class WeightedTouchpointAssignmentEngine {
  steps: WeightedTouchpointAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTouchpointAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedTouchpointAssignment): number {
    let current = item.measuredValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: WeightedTouchpointAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedTouchpointAssignmentEngine(flagsValue: flags.Registry): WeightedTouchpointAssignmentEngine {
  return new WeightedTouchpointAssignmentEngine(
    [
      new RoundingWeightedTouchpointAssignmentAdjuster(0.1),
      new FlaggedWeightedTouchpointAssignmentAdjuster(
        flagsValue,
        "weighted-touchpoint-assignment-batched",
        -2.9,
      ),
      new MinimumWeightedTouchpointAssignmentAdjuster(28.1),
      new PercentWeightedTouchpointAssignmentAdjuster(5.1),
    ],
    [],
    1.8,
    74510.1,
  );
}
