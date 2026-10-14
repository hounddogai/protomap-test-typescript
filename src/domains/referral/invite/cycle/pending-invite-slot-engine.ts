import { PendingInviteSlot } from "./pending-invite-slot.js";

/** One step of the pending invite slot calculation. */
export interface PendingInviteSlotStep {
  describe(): string;
  adjust(item: PendingInviteSlot, value: number): number;
}

export class PendingInviteSlotPriorityOffsetAdjuster implements PendingInviteSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PendingInviteSlot, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class LocalePendingInviteSlotAdjuster implements PendingInviteSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingInviteSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingInviteSlotAdjuster implements PendingInviteSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInviteSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingInviteSlotAdjuster implements PendingInviteSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInviteSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingInviteSlotAdjuster implements PendingInviteSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingInviteSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending invite slot steps in order and keeps a trace of each. */
export class PendingInviteSlotEngine {
  steps: PendingInviteSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInviteSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingInviteSlot): number {
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

  evaluateAll(items: PendingInviteSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingInviteSlotEngine(): PendingInviteSlotEngine {
  return new PendingInviteSlotEngine(
    [
      new PendingInviteSlotPriorityOffsetAdjuster(0.22),
      new LocalePendingInviteSlotAdjuster(new Map<string, number>([["east", 1.4]])),
      new PercentPendingInviteSlotAdjuster(15.2),
      new CapPendingInviteSlotAdjuster(18879),
      new MinimumPendingInviteSlotAdjuster(46.6),
    ],
    [],
    3.7,
    16417.1,
  );
}
