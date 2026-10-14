import * as numbers from "../../../../kit/numbers.js";
import { MentionTier } from "./mention-tier.js";

/** One step of the mention tier calculation. */
export interface MentionTierAdjuster {
  describe(): string;
  adjust(item: MentionTier, value: number): number;
}

export class RoundingMentionTierAdjuster implements MentionTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumMentionTierAdjuster implements MentionTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MentionTierAmountOffsetAdjuster implements MentionTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: MentionTier, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the mention tier steps in order and keeps a trace of each. */
export class MentionTierEngine {
  steps: MentionTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionTier): number {
    let current = item.netLoad();
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

  evaluateAll(items: MentionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionTierEngine(): MentionTierEngine {
  return new MentionTierEngine(
    [
      new RoundingMentionTierAdjuster(1),
      new MinimumMentionTierAdjuster(5.2),
      new MentionTierAmountOffsetAdjuster(1.02),
    ],
    [],
    1,
    25470,
  );
}
