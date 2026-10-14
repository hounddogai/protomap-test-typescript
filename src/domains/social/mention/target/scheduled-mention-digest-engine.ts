import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledMentionDigest } from "./scheduled-mention-digest.js";

/** One step of the scheduled mention digest calculation. */
export interface ScheduledMentionDigestModifier {
  describe(): string;
  adjust(item: ScheduledMentionDigest, value: number): number;
}

export class RoundingScheduledMentionDigestAdjuster implements ScheduledMentionDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledMentionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedScheduledMentionDigestAdjuster implements ScheduledMentionDigestModifier {
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

  adjust(item: ScheduledMentionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledMentionDigestAdjuster implements ScheduledMentionDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledMentionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled mention digest steps in order and keeps a trace of each. */
export class ScheduledMentionDigestEngine {
  steps: ScheduledMentionDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledMentionDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledMentionDigest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ScheduledMentionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledMentionDigestEngine(flagsValue: flags.Registry): ScheduledMentionDigestEngine {
  return new ScheduledMentionDigestEngine(
    [
      new RoundingScheduledMentionDigestAdjuster(0.25),
      new FlaggedScheduledMentionDigestAdjuster(flagsValue, "scheduled-mention-digest-strict", 9.1),
      new TieredScheduledMentionDigestAdjuster([2741, 6660, 8022], [1.02, 1.05, 1.02]),
    ],
    [],
    0.2,
    16017.3,
  );
}
