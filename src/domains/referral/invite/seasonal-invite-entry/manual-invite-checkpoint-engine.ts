import { ManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

/** One step of the manual invite checkpoint calculation. */
export interface ManualInviteCheckpointModifier {
  describe(): string;
  adjust(item: ManualInviteCheckpoint, value: number): number;
}

export class CapManualInviteCheckpointAdjuster implements ManualInviteCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualInviteCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualInviteCheckpointAdjuster implements ManualInviteCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualInviteCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitManualInviteCheckpointAdjuster implements ManualInviteCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ManualInviteCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual invite checkpoint steps in order and keeps a trace of each. */
export class ManualInviteCheckpointEngine {
  steps: ManualInviteCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualInviteCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualInviteCheckpoint): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ManualInviteCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualInviteCheckpointEngine(): ManualInviteCheckpointEngine {
  return new ManualInviteCheckpointEngine(
    [
      new CapManualInviteCheckpointAdjuster(37562),
      new MinimumManualInviteCheckpointAdjuster(23.8),
      new UnitManualInviteCheckpointAdjuster(new Map<string, number>([["south", 1.24]])),
    ],
    [],
    0.7,
    29632.6,
  );
}
