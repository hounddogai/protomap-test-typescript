import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictSlaMilestone } from "./strict-sla-milestone.js";

/** One step of the strict sla milestone calculation. */
export interface StrictSlaMilestoneFactor {
  describe(): string;
  adjust(item: StrictSlaMilestone, value: number): number;
}

export class MinimumStrictSlaMilestoneAdjuster implements StrictSlaMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictSlaMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictSlaMilestoneAdjuster implements StrictSlaMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictSlaMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedStrictSlaMilestoneAdjuster implements StrictSlaMilestoneFactor {
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

  adjust(item: StrictSlaMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict sla milestone steps in order and keeps a trace of each. */
export class StrictSlaMilestoneEngine {
  steps: StrictSlaMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictSlaMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictSlaMilestone): number {
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

  evaluateAll(items: StrictSlaMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictSlaMilestoneEngine(flagsValue: flags.Registry): StrictSlaMilestoneEngine {
  return new StrictSlaMilestoneEngine(
    [
      new MinimumStrictSlaMilestoneAdjuster(46.5),
      new RoundingStrictSlaMilestoneAdjuster(1),
      new FlaggedStrictSlaMilestoneAdjuster(flagsValue, "strict-sla-milestone-lenient", 0.9),
    ],
    [],
    3.2,
    77821,
  );
}
