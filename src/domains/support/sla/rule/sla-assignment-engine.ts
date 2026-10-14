import * as numbers from "../../../../kit/numbers.js";
import { SlaAssignment } from "./sla-assignment.js";

/** One step of the sla assignment calculation. */
export interface SlaAssignmentAdjuster {
  describe(): string;
  adjust(item: SlaAssignment, value: number): number;
}

export class CapSlaAssignmentAdjuster implements SlaAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentSlaAssignmentAdjuster implements SlaAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SlaAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SlaAssignmentThresholdOffsetAdjuster implements SlaAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: SlaAssignment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentSlaAssignmentAdjuster implements SlaAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sla assignment steps in order and keeps a trace of each. */
export class SlaAssignmentEngine {
  steps: SlaAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaAssignment): number {
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

  evaluateAll(items: SlaAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaAssignmentEngine(): SlaAssignmentEngine {
  return new SlaAssignmentEngine(
    [
      new CapSlaAssignmentAdjuster(39423),
      new SegmentSlaAssignmentAdjuster(
        new Map<string, number>([["central", 1.38], ["retail", 0.86], ["east", 1.36]]),
      ),
      new SlaAssignmentThresholdOffsetAdjuster(1),
      new PercentSlaAssignmentAdjuster(-18.3),
    ],
    [],
    1.8,
    11039.8,
  );
}
