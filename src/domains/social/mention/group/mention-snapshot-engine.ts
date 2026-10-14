import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionSnapshot } from "./mention-snapshot.js";

/** One step of the mention snapshot calculation. */
export interface MentionSnapshotModifier {
  describe(): string;
  adjust(item: MentionSnapshot, value: number): number;
}

export class MinimumMentionSnapshotAdjuster implements MentionSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredMentionSnapshotAdjuster implements MentionSnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMentionSnapshotAdjuster implements MentionSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelMentionSnapshotAdjuster implements MentionSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: MentionSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingMentionSnapshotAdjuster implements MentionSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedMentionSnapshotAdjuster implements MentionSnapshotModifier {
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

  adjust(item: MentionSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention snapshot steps in order and keeps a trace of each. */
export class MentionSnapshotEngine {
  steps: MentionSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionSnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: MentionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionSnapshotEngine(flagsValue: flags.Registry): MentionSnapshotEngine {
  return new MentionSnapshotEngine(
    [
      new MinimumMentionSnapshotAdjuster(17.6),
      new TieredMentionSnapshotAdjuster([2314, 2996, 6616], [1.03, 1.05, 0.87]),
      new CapMentionSnapshotAdjuster(15033),
      new ChannelMentionSnapshotAdjuster(
        new Map<string, number>([["east", 1.09], ["central", 0.73], ["west", 1.27]]),
      ),
      new RoundingMentionSnapshotAdjuster(5),
      new FlaggedMentionSnapshotAdjuster(flagsValue, "mention-snapshot-lenient", -7.8),
    ],
    [],
    2,
    63525.6,
  );
}
