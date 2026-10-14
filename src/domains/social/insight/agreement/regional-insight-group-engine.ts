import * as flags from "../../../../kit/flags.js";
import { RegionalInsightGroup } from "./regional-insight-group.js";

/** One step of the regional insight group calculation. */
export interface RegionalInsightGroupModifier {
  describe(): string;
  adjust(item: RegionalInsightGroup, value: number): number;
}

export class FlaggedRegionalInsightGroupAdjuster implements RegionalInsightGroupModifier {
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

  adjust(item: RegionalInsightGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalInsightGroupAdjuster implements RegionalInsightGroupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalInsightGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelRegionalInsightGroupAdjuster implements RegionalInsightGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalInsightGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional insight group steps in order and keeps a trace of each. */
export class RegionalInsightGroupEngine {
  steps: RegionalInsightGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalInsightGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalInsightGroup): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: RegionalInsightGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalInsightGroupEngine(flagsValue: flags.Registry): RegionalInsightGroupEngine {
  return new RegionalInsightGroupEngine(
    [
      new FlaggedRegionalInsightGroupAdjuster(flagsValue, "regional-insight-group-fallback", -9.7),
      new MinimumRegionalInsightGroupAdjuster(18),
      new LabelRegionalInsightGroupAdjuster(
        new Map<string, number>([["east", 0.79], ["retail", 1.22], ["online", 1.02]]),
      ),
    ],
    [],
    4.3,
    81159.6,
  );
}
