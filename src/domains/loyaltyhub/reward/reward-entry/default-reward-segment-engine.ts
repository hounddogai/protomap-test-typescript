import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultRewardSegment } from "./default-reward-segment.js";

/** One step of the default reward segment calculation. */
export interface DefaultRewardSegmentModifier {
  describe(): string;
  adjust(item: DefaultRewardSegment, value: number): number;
}

export class LocaleDefaultRewardSegmentAdjuster implements DefaultRewardSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DefaultRewardSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDefaultRewardSegmentAdjuster implements DefaultRewardSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultRewardSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDefaultRewardSegmentAdjuster implements DefaultRewardSegmentModifier {
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

  adjust(item: DefaultRewardSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultRewardSegmentAdjuster implements DefaultRewardSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultRewardSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default reward segment steps in order and keeps a trace of each. */
export class DefaultRewardSegmentEngine {
  steps: DefaultRewardSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultRewardSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultRewardSegment): number {
    let current = item.netValue();
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

  evaluateAll(items: DefaultRewardSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultRewardSegmentEngine(flagsValue: flags.Registry): DefaultRewardSegmentEngine {
  return new DefaultRewardSegmentEngine(
    [
      new LocaleDefaultRewardSegmentAdjuster(
        new Map<string, number>([["west", 0.86], ["online", 1.08], ["retail", 1.28]]),
      ),
      new MinimumDefaultRewardSegmentAdjuster(29.4),
      new FlaggedDefaultRewardSegmentAdjuster(flagsValue, "default-reward-segment-default", 9.6),
      new RoundingDefaultRewardSegmentAdjuster(5),
    ],
    [],
    3.5,
    16445.4,
  );
}
