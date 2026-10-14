import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedMentionDigest } from "./weighted-mention-digest.js";

/** One step of the weighted mention digest calculation. */
export interface WeightedMentionDigestStep {
  describe(): string;
  adjust(item: WeightedMentionDigest, value: number): number;
}

export class WeightedMentionDigestCeilingOffsetAdjuster implements WeightedMentionDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: WeightedMentionDigest, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingWeightedMentionDigestAdjuster implements WeightedMentionDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedMentionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedMentionDigestAdjuster implements WeightedMentionDigestStep {
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

  adjust(item: WeightedMentionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedMentionDigestAdjuster implements WeightedMentionDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedMentionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleWeightedMentionDigestAdjuster implements WeightedMentionDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedMentionDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted mention digest steps in order and keeps a trace of each. */
export class WeightedMentionDigestEngine {
  steps: WeightedMentionDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedMentionDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedMentionDigest): number {
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

  evaluateAll(items: WeightedMentionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedMentionDigestEngine(flagsValue: flags.Registry): WeightedMentionDigestEngine {
  return new WeightedMentionDigestEngine(
    [
      new WeightedMentionDigestCeilingOffsetAdjuster(1.36),
      new RoundingWeightedMentionDigestAdjuster(0.1),
      new FlaggedWeightedMentionDigestAdjuster(flagsValue, "weighted-mention-digest-tiered", -2.8),
      new CapWeightedMentionDigestAdjuster(42932),
      new TitleWeightedMentionDigestAdjuster(new Map<string, number>([["south", 0.77], ["east", 0.8]])),
    ],
    [],
    0.7,
    57139.5,
  );
}
