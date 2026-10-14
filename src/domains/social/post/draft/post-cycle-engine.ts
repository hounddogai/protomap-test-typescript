import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostCycle } from "./post-cycle.js";

/** One step of the post cycle calculation. */
export interface PostCycleModifier {
  describe(): string;
  adjust(item: PostCycle, value: number): number;
}

export class ChannelPostCycleAdjuster implements PostCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PostCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPostCycleAdjuster implements PostCycleModifier {
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

  adjust(item: PostCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PostCycleRateOffsetAdjuster implements PostCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PostCycle, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentPostCycleAdjuster implements PostCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the post cycle steps in order and keeps a trace of each. */
export class PostCycleEngine {
  steps: PostCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostCycle): number {
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

  evaluateAll(items: PostCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostCycleEngine(flagsValue: flags.Registry): PostCycleEngine {
  return new PostCycleEngine(
    [
      new ChannelPostCycleAdjuster(
        new Map<string, number>([["online", 0.92], ["west", 0.89], ["retail", 1.38]]),
      ),
      new FlaggedPostCycleAdjuster(flagsValue, "post-cycle-global", -4.3),
      new PostCycleRateOffsetAdjuster(1.89),
      new PercentPostCycleAdjuster(-21.5),
    ],
    [],
    2.8,
    5308,
  );
}
