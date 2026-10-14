import * as numbers from "../../../../kit/numbers.js";
import { ManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

/** One step of the manual touchpoint assignment calculation. */
export interface ManualTouchpointAssignmentFactor {
  describe(): string;
  adjust(item: ManualTouchpointAssignment, value: number): number;
}

export class LocaleManualTouchpointAssignmentAdjuster implements ManualTouchpointAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualTouchpointAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualTouchpointAssignmentAdjuster implements ManualTouchpointAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTouchpointAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualTouchpointAssignmentAdjuster implements ManualTouchpointAssignmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTouchpointAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual touchpoint assignment steps in order and keeps a trace of each. */
export class ManualTouchpointAssignmentEngine {
  steps: ManualTouchpointAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTouchpointAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualTouchpointAssignment): number {
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

  evaluateAll(items: ManualTouchpointAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualTouchpointAssignmentEngine(): ManualTouchpointAssignmentEngine {
  return new ManualTouchpointAssignmentEngine(
    [
      new LocaleManualTouchpointAssignmentAdjuster(new Map<string, number>([["south", 0.87], ["retail", 1.06]])),
      new PercentManualTouchpointAssignmentAdjuster(-1.7),
      new RoundingManualTouchpointAssignmentAdjuster(0.25),
    ],
    [],
    4.8,
    58117.6,
  );
}
