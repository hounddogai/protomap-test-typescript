import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredRetentionDraft } from "./tiered-retention-draft.js";

/** One step of the tiered retention draft calculation. */
export interface TieredRetentionDraftFactor {
  describe(): string;
  adjust(item: TieredRetentionDraft, value: number): number;
}

export class RoundingTieredRetentionDraftAdjuster implements TieredRetentionDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRetentionDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredRetentionDraftAdjuster implements TieredRetentionDraftFactor {
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

  adjust(item: TieredRetentionDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredRetentionDraftAdjuster implements TieredRetentionDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRetentionDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionTieredRetentionDraftAdjuster implements TieredRetentionDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TieredRetentionDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered retention draft steps in order and keeps a trace of each. */
export class TieredRetentionDraftEngine {
  steps: TieredRetentionDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRetentionDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredRetentionDraft): number {
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

  evaluateAll(items: TieredRetentionDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredRetentionDraftEngine(flagsValue: flags.Registry): TieredRetentionDraftEngine {
  return new TieredRetentionDraftEngine(
    [
      new RoundingTieredRetentionDraftAdjuster(1),
      new FlaggedTieredRetentionDraftAdjuster(flagsValue, "tiered-retention-draft-fallback", 3.1),
      new MinimumTieredRetentionDraftAdjuster(45.9),
      new RegionTieredRetentionDraftAdjuster(
        new Map<string, number>([["north", 0.9], ["online", 1.32], ["central", 1.22]]),
      ),
    ],
    [],
    3.9,
    31700.3,
  );
}
