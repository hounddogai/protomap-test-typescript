import * as numbers from "../../../../kit/numbers.js";
import { EscalationAssignment } from "./escalation-assignment.js";

/** One step of the escalation assignment calculation. */
export interface EscalationAssignmentAdjuster {
  describe(): string;
  adjust(item: EscalationAssignment, value: number): number;
}

export class CapEscalationAssignmentAdjuster implements EscalationAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEscalationAssignmentAdjuster implements EscalationAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleEscalationAssignmentAdjuster implements EscalationAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: EscalationAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EscalationAssignmentImpressionsOffsetAdjuster implements EscalationAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: EscalationAssignment, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the escalation assignment steps in order and keeps a trace of each. */
export class EscalationAssignmentEngine {
  steps: EscalationAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EscalationAssignment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: EscalationAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEscalationAssignmentEngine(): EscalationAssignmentEngine {
  return new EscalationAssignmentEngine(
    [
      new CapEscalationAssignmentAdjuster(1918),
      new RoundingEscalationAssignmentAdjuster(0.5),
      new TitleEscalationAssignmentAdjuster(new Map<string, number>([["central", 1.15]])),
      new EscalationAssignmentImpressionsOffsetAdjuster(1.72),
    ],
    [],
    2.7,
    93034.2,
  );
}
