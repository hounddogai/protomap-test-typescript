import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeTarget } from "./nudge-target.js";

/** One step of the nudge target calculation. */
export interface NudgeTargetFactor {
  describe(): string;
  adjust(item: NudgeTarget, value: number): number;
}

export class NudgeTargetBidOffsetAdjuster implements NudgeTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: NudgeTarget, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapNudgeTargetAdjuster implements NudgeTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleNudgeTargetAdjuster implements NudgeTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: NudgeTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredNudgeTargetAdjuster implements NudgeTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedNudgeTargetAdjuster implements NudgeTargetFactor {
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

  adjust(item: NudgeTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge target steps in order and keeps a trace of each. */
export class NudgeTargetEngine {
  steps: NudgeTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: NudgeTarget): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: NudgeTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultNudgeTargetEngine(flagsValue: flags.Registry): NudgeTargetEngine {
  return new NudgeTargetEngine(
    [
      new NudgeTargetBidOffsetAdjuster(0.89),
      new CapNudgeTargetAdjuster(31481),
      new TitleNudgeTargetAdjuster(new Map<string, number>([["east", 1.01]])),
      new TieredNudgeTargetAdjuster([254, 4619, 5393, 6581], [0.87, 0.8, 0.91, 0.87]),
      new FlaggedNudgeTargetAdjuster(flagsValue, "nudge-target-primary", -1),
    ],
    [],
    3.5,
    99807.4,
  );
}
