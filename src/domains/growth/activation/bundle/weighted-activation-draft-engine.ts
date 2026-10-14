import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedActivationDraft } from "./weighted-activation-draft.js";

/** One step of the weighted activation draft calculation. */
export interface WeightedActivationDraftAdjuster {
  describe(): string;
  adjust(item: WeightedActivationDraft, value: number): number;
}

export class RoundingWeightedActivationDraftAdjuster implements WeightedActivationDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedActivationDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWeightedActivationDraftAdjuster implements WeightedActivationDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedActivationDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWeightedActivationDraftAdjuster implements WeightedActivationDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedActivationDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedActivationDraftAdjuster implements WeightedActivationDraftAdjuster {
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

  adjust(item: WeightedActivationDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedActivationDraftAdjuster implements WeightedActivationDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedActivationDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted activation draft steps in order and keeps a trace of each. */
export class WeightedActivationDraftEngine {
  steps: WeightedActivationDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedActivationDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedActivationDraft): number {
    let current = item.netLoad();
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

  evaluateAll(items: WeightedActivationDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedActivationDraftEngine(flagsValue: flags.Registry): WeightedActivationDraftEngine {
  return new WeightedActivationDraftEngine(
    [
      new RoundingWeightedActivationDraftAdjuster(0.25),
      new MinimumWeightedActivationDraftAdjuster(34.4),
      new CapWeightedActivationDraftAdjuster(37531),
      new FlaggedWeightedActivationDraftAdjuster(flagsValue, "weighted-activation-draft-default", 8.6),
      new TieredWeightedActivationDraftAdjuster([3184, 6428, 8321, 8372], [0.85, 1.08, 0.88, 0.81]),
    ],
    [],
    4.8,
    38820.9,
  );
}
