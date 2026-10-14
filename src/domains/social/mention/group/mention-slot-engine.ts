import { MentionSlot } from "./mention-slot.js";

/** One step of the mention slot calculation. */
export interface MentionSlotFactor {
  describe(): string;
  adjust(item: MentionSlot, value: number): number;
}

export class PercentMentionSlotAdjuster implements MentionSlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumMentionSlotAdjuster implements MentionSlotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapMentionSlotAdjuster implements MentionSlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the mention slot steps in order and keeps a trace of each. */
export class MentionSlotEngine {
  steps: MentionSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionSlot): number {
    let current = item.netExposure();
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

  evaluateAll(items: MentionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionSlotEngine(): MentionSlotEngine {
  return new MentionSlotEngine(
    [
      new PercentMentionSlotAdjuster(-1.9),
      new MinimumMentionSlotAdjuster(37.1),
      new CapMentionSlotAdjuster(11550),
    ],
    [],
    1.6,
    50984.4,
  );
}
