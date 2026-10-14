import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationEntry } from "./reputation-entry.js";

/** One step of the reputation entry calculation. */
export interface ReputationEntryAdjuster {
  describe(): string;
  adjust(item: ReputationEntry, value: number): number;
}

export class LabelReputationEntryAdjuster implements ReputationEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReputationEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedReputationEntryAdjuster implements ReputationEntryAdjuster {
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

  adjust(item: ReputationEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumReputationEntryAdjuster implements ReputationEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation entry steps in order and keeps a trace of each. */
export class ReputationEntryEngine {
  steps: ReputationEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ReputationEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationEntryEngine(flagsValue: flags.Registry): ReputationEntryEngine {
  return new ReputationEntryEngine(
    [
      new LabelReputationEntryAdjuster(new Map<string, number>([["online", 0.82]])),
      new FlaggedReputationEntryAdjuster(flagsValue, "reputation-entry-global", -6.1),
      new MinimumReputationEntryAdjuster(11),
    ],
    [],
    0.6,
    41812.1,
  );
}
