import * as numbers from "../../../../kit/numbers.js";
import { PrimaryInviteAssignment } from "./primary-invite-assignment.js";

/** One step of the primary invite assignment calculation. */
export interface PrimaryInviteAssignmentStep {
  describe(): string;
  adjust(item: PrimaryInviteAssignment, value: number): number;
}

export class ChannelPrimaryInviteAssignmentAdjuster implements PrimaryInviteAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PrimaryInviteAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPrimaryInviteAssignmentAdjuster implements PrimaryInviteAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryInviteAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryInviteAssignmentAdjuster implements PrimaryInviteAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryInviteAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary invite assignment steps in order and keeps a trace of each. */
export class PrimaryInviteAssignmentEngine {
  steps: PrimaryInviteAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInviteAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryInviteAssignment): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PrimaryInviteAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryInviteAssignmentEngine(): PrimaryInviteAssignmentEngine {
  return new PrimaryInviteAssignmentEngine(
    [
      new ChannelPrimaryInviteAssignmentAdjuster(new Map<string, number>([["north", 1.23]])),
      new CapPrimaryInviteAssignmentAdjuster(36742),
      new RoundingPrimaryInviteAssignmentAdjuster(0.25),
    ],
    [],
    4.3,
    44544.5,
  );
}
