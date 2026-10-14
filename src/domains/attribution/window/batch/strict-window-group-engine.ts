import * as flags from "../../../../kit/flags.js";
import { StrictWindowGroup } from "./strict-window-group.js";

/** One step of the strict window group calculation. */
export interface StrictWindowGroupModifier {
  describe(): string;
  adjust(item: StrictWindowGroup, value: number): number;
}

export class MinimumStrictWindowGroupAdjuster implements StrictWindowGroupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictWindowGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStrictWindowGroupAdjuster implements StrictWindowGroupModifier {
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

  adjust(item: StrictWindowGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class StrictWindowGroupRetriesOffsetAdjuster implements StrictWindowGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: StrictWindowGroup, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class PercentStrictWindowGroupAdjuster implements StrictWindowGroupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictWindowGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict window group steps in order and keeps a trace of each. */
export class StrictWindowGroupEngine {
  steps: StrictWindowGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictWindowGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictWindowGroup): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: StrictWindowGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictWindowGroupEngine(flagsValue: flags.Registry): StrictWindowGroupEngine {
  return new StrictWindowGroupEngine(
    [
      new MinimumStrictWindowGroupAdjuster(19.8),
      new FlaggedStrictWindowGroupAdjuster(flagsValue, "strict-window-group-seasonal", -3.2),
      new StrictWindowGroupRetriesOffsetAdjuster(0.97),
      new PercentStrictWindowGroupAdjuster(-7.9),
    ],
    [],
    3.8,
    62830.1,
  );
}
