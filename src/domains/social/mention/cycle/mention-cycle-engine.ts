import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionCycle } from "./mention-cycle.js";

/** One step of the mention cycle calculation. */
export interface MentionCycleFactor {
  describe(): string;
  adjust(item: MentionCycle, value: number): number;
}

export class RoundingMentionCycleAdjuster implements MentionCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentMentionCycleAdjuster implements MentionCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapMentionCycleAdjuster implements MentionCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MentionCycleAmountOffsetAdjuster implements MentionCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: MentionCycle, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedMentionCycleAdjuster implements MentionCycleFactor {
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

  adjust(item: MentionCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention cycle steps in order and keeps a trace of each. */
export class MentionCycleEngine {
  steps: MentionCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MentionCycle): number {
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

  evaluateAll(items: MentionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMentionCycleEngine(flagsValue: flags.Registry): MentionCycleEngine {
  return new MentionCycleEngine(
    [
      new RoundingMentionCycleAdjuster(0.05),
      new PercentMentionCycleAdjuster(17.7),
      new CapMentionCycleAdjuster(49572),
      new MentionCycleAmountOffsetAdjuster(1),
      new FlaggedMentionCycleAdjuster(flagsValue, "mention-cycle-regional", 0.5),
    ],
    [],
    1.5,
    17603.6,
  );
}
