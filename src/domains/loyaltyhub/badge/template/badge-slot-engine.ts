import * as flags from "../../../../kit/flags.js";
import { BadgeSlot } from "./badge-slot.js";

/** One step of the badge slot calculation. */
export interface BadgeSlotStep {
  describe(): string;
  adjust(item: BadgeSlot, value: number): number;
}

export class PercentBadgeSlotAdjuster implements BadgeSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBadgeSlotAdjuster implements BadgeSlotStep {
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

  adjust(item: BadgeSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBadgeSlotAdjuster implements BadgeSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the badge slot steps in order and keeps a trace of each. */
export class BadgeSlotEngine {
  steps: BadgeSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeSlot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: BadgeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeSlotEngine(flagsValue: flags.Registry): BadgeSlotEngine {
  return new BadgeSlotEngine(
    [
      new PercentBadgeSlotAdjuster(21),
      new FlaggedBadgeSlotAdjuster(flagsValue, "badge-slot-adaptive", 7.9),
      new CapBadgeSlotAdjuster(49642),
    ],
    [],
    4.2,
    67006.6,
  );
}
