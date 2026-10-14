import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelDraft } from "./level-draft.js";

/** One step of the level draft calculation. */
export interface LevelDraftAdjuster {
  describe(): string;
  adjust(item: LevelDraft, value: number): number;
}

export class TieredLevelDraftAdjuster implements LevelDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLevelDraftAdjuster implements LevelDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLevelDraftAdjuster implements LevelDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLevelDraftAdjuster implements LevelDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleLevelDraftAdjuster implements LevelDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LevelDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLevelDraftAdjuster implements LevelDraftAdjuster {
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

  adjust(item: LevelDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level draft steps in order and keeps a trace of each. */
export class LevelDraftEngine {
  steps: LevelDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LevelDraft): number {
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

  evaluateAll(items: LevelDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLevelDraftEngine(flagsValue: flags.Registry): LevelDraftEngine {
  return new LevelDraftEngine(
    [
      new TieredLevelDraftAdjuster([1429, 2301, 3797], [0.84, 1.03, 1.04]),
      new PercentLevelDraftAdjuster(-23.3),
      new CapLevelDraftAdjuster(7326),
      new RoundingLevelDraftAdjuster(0.25),
      new TitleLevelDraftAdjuster(new Map<string, number>([["central", 0.75], ["south", 0.95]])),
      new FlaggedLevelDraftAdjuster(flagsValue, "level-draft-adaptive", -0.4),
    ],
    [],
    2.1,
    26919.2,
  );
}
