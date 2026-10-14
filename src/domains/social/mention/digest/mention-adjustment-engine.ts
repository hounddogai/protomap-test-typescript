import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionAdjustment } from "./mention-adjustment.js";

/** One step of the mention adjustment calculation. */
export interface MentionAdjustmentFactor {
  describe(): string;
  adjust(item: MentionAdjustment, value: number): number;
}

export class TieredMentionAdjustmentAdjuster implements MentionAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MentionAdjustmentCostOffsetAdjuster implements MentionAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: MentionAdjustment, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedMentionAdjustmentAdjuster implements MentionAdjustmentFactor {
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

  adjust(item: MentionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention adjustment steps in order and keeps a trace of each. */
export class MentionAdjustmentEngine {
  steps: MentionAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MentionAdjustment): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: MentionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMentionAdjustmentEngine(flagsValue: flags.Registry): MentionAdjustmentEngine {
  return new MentionAdjustmentEngine(
    [
      new TieredMentionAdjustmentAdjuster([1363, 3499], [1.13, 1.08]),
      new MentionAdjustmentCostOffsetAdjuster(1.66),
      new FlaggedMentionAdjustmentAdjuster(flagsValue, "mention-adjustment-scheduled", 0.2),
    ],
    [],
    0.8,
    75624.6,
  );
}
