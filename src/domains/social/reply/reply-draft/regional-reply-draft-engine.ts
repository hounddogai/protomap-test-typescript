import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalReplyDraft } from "./regional-reply-draft.js";

/** One step of the regional reply draft calculation. */
export interface RegionalReplyDraftFactor {
  describe(): string;
  adjust(item: RegionalReplyDraft, value: number): number;
}

export class TieredRegionalReplyDraftAdjuster implements RegionalReplyDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalReplyDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRegionalReplyDraftAdjuster implements RegionalReplyDraftFactor {
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

  adjust(item: RegionalReplyDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalReplyDraftAdjuster implements RegionalReplyDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalReplyDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional reply draft steps in order and keeps a trace of each. */
export class RegionalReplyDraftEngine {
  steps: RegionalReplyDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalReplyDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalReplyDraft): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalReplyDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalReplyDraftEngine(flagsValue: flags.Registry): RegionalReplyDraftEngine {
  return new RegionalReplyDraftEngine(
    [
      new TieredRegionalReplyDraftAdjuster([1910, 4539, 6255, 6462], [0.83, 0.97, 0.84, 1.13]),
      new FlaggedRegionalReplyDraftAdjuster(flagsValue, "regional-reply-draft-legacy", -1.6),
      new RoundingRegionalReplyDraftAdjuster(5),
    ],
    [],
    0.2,
    81417.4,
  );
}
