import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionDigest } from "./mention-digest.js";

/** One step of the mention digest calculation. */
export interface MentionDigestModifier {
  describe(): string;
  adjust(item: MentionDigest, value: number): number;
}

export class RoundingMentionDigestAdjuster implements MentionDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredMentionDigestAdjuster implements MentionDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMentionDigestAdjuster implements MentionDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentMentionDigestAdjuster implements MentionDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: MentionDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedMentionDigestAdjuster implements MentionDigestModifier {
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

  adjust(item: MentionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention digest steps in order and keeps a trace of each. */
export class MentionDigestEngine {
  steps: MentionDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MentionDigest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: MentionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMentionDigestEngine(flagsValue: flags.Registry): MentionDigestEngine {
  return new MentionDigestEngine(
    [
      new RoundingMentionDigestAdjuster(0.1),
      new TieredMentionDigestAdjuster([2038, 3986, 5040, 5193], [0.85, 1.13, 1.05, 1.01]),
      new CapMentionDigestAdjuster(21568),
      new SegmentMentionDigestAdjuster(new Map<string, number>([["online", 1], ["south", 1.15]])),
      new FlaggedMentionDigestAdjuster(flagsValue, "mention-digest-legacy", 9.8),
    ],
    [],
    2.5,
    76969.1,
  );
}
