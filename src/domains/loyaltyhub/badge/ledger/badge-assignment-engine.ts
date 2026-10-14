import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeAssignment } from "./badge-assignment.js";

/** One step of the badge assignment calculation. */
export interface BadgeAssignmentModifier {
  describe(): string;
  adjust(item: BadgeAssignment, value: number): number;
}

export class FlaggedBadgeAssignmentAdjuster implements BadgeAssignmentModifier {
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

  adjust(item: BadgeAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBadgeAssignmentAdjuster implements BadgeAssignmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameBadgeAssignmentAdjuster implements BadgeAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BadgeAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BadgeAssignmentDurationMinutesOffsetAdjuster implements BadgeAssignmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: BadgeAssignment, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the badge assignment steps in order and keeps a trace of each. */
export class BadgeAssignmentEngine {
  steps: BadgeAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BadgeAssignment): number {
    let current = item.netTotal();
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

  evaluateAll(items: BadgeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBadgeAssignmentEngine(flagsValue: flags.Registry): BadgeAssignmentEngine {
  return new BadgeAssignmentEngine(
    [
      new FlaggedBadgeAssignmentAdjuster(flagsValue, "badge-assignment-capped", -8.6),
      new MinimumBadgeAssignmentAdjuster(11.2),
      new NameBadgeAssignmentAdjuster(new Map<string, number>([["west", 1.1]])),
      new BadgeAssignmentDurationMinutesOffsetAdjuster(1.28),
    ],
    [],
    3.5,
    58194.8,
  );
}
