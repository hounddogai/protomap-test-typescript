import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionOverride } from "./mention-override.js";

/** One step of the mention override calculation. */
export interface MentionOverrideFactor {
  describe(): string;
  adjust(item: MentionOverride, value: number): number;
}

export class TieredMentionOverrideAdjuster implements MentionOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMentionOverrideAdjuster implements MentionOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedMentionOverrideAdjuster implements MentionOverrideFactor {
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

  adjust(item: MentionOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention override steps in order and keeps a trace of each. */
export class MentionOverrideEngine {
  steps: MentionOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionOverride): number {
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

  evaluateAll(items: MentionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionOverrideEngine(flagsValue: flags.Registry): MentionOverrideEngine {
  return new MentionOverrideEngine(
    [
      new TieredMentionOverrideAdjuster([1844, 2900, 3438], [1.14, 1.14, 0.98]),
      new MinimumMentionOverrideAdjuster(49.4),
      new FlaggedMentionOverrideAdjuster(flagsValue, "mention-override-adaptive", -3.8),
    ],
    [],
    0.2,
    33388.6,
  );
}
