import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionBaseline } from "./mention-baseline.js";

/** One step of the mention baseline calculation. */
export interface MentionBaselineModifier {
  describe(): string;
  adjust(item: MentionBaseline, value: number): number;
}

export class RoundingMentionBaselineAdjuster implements MentionBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapMentionBaselineAdjuster implements MentionBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedMentionBaselineAdjuster implements MentionBaselineModifier {
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

  adjust(item: MentionBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentMentionBaselineAdjuster implements MentionBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredMentionBaselineAdjuster implements MentionBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the mention baseline steps in order and keeps a trace of each. */
export class MentionBaselineEngine {
  steps: MentionBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionBaseline): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: MentionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionBaselineEngine(flagsValue: flags.Registry): MentionBaselineEngine {
  return new MentionBaselineEngine(
    [
      new RoundingMentionBaselineAdjuster(5),
      new CapMentionBaselineAdjuster(28083),
      new FlaggedMentionBaselineAdjuster(flagsValue, "mention-baseline-legacy", 9.3),
      new PercentMentionBaselineAdjuster(4.7),
      new TieredMentionBaselineAdjuster([1081, 1549, 8914], [0.82, 0.89, 1.18]),
    ],
    [],
    2.2,
    55654.4,
  );
}
