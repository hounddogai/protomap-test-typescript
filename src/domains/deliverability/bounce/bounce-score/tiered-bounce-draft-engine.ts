import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBounceDraft } from "./tiered-bounce-draft.js";

/** One step of the tiered bounce draft calculation. */
export interface TieredBounceDraftFactor {
  describe(): string;
  adjust(item: TieredBounceDraft, value: number): number;
}

export class CapTieredBounceDraftAdjuster implements TieredBounceDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBounceDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBounceDraftScoreOffsetAdjuster implements TieredBounceDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TieredBounceDraft, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TieredTieredBounceDraftAdjuster implements TieredBounceDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBounceDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelTieredBounceDraftAdjuster implements TieredBounceDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredBounceDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredBounceDraftAdjuster implements TieredBounceDraftFactor {
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

  adjust(item: TieredBounceDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredBounceDraftAdjuster implements TieredBounceDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBounceDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered bounce draft steps in order and keeps a trace of each. */
export class TieredBounceDraftEngine {
  steps: TieredBounceDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBounceDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredBounceDraft): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredBounceDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredBounceDraftEngine(flagsValue: flags.Registry): TieredBounceDraftEngine {
  return new TieredBounceDraftEngine(
    [
      new CapTieredBounceDraftAdjuster(13085),
      new TieredBounceDraftScoreOffsetAdjuster(0.95),
      new TieredTieredBounceDraftAdjuster([6527, 6911], [1.16, 1.16]),
      new ChannelTieredBounceDraftAdjuster(
        new Map<string, number>([["retail", 0.92], ["east", 1.26], ["south", 1.39]]),
      ),
      new FlaggedTieredBounceDraftAdjuster(flagsValue, "tiered-bounce-draft-lenient", -5.8),
      new RoundingTieredBounceDraftAdjuster(0.05),
    ],
    [],
    0.1,
    95193.9,
  );
}
