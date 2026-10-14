import * as flags from "../../../../kit/flags.js";
import { WindowCheckpoint } from "./window-checkpoint.js";

/** One step of the window checkpoint calculation. */
export interface WindowCheckpointModifier {
  describe(): string;
  adjust(item: WindowCheckpoint, value: number): number;
}

export class FlaggedWindowCheckpointAdjuster implements WindowCheckpointModifier {
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

  adjust(item: WindowCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleWindowCheckpointAdjuster implements WindowCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WindowCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWindowCheckpointAdjuster implements WindowCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WindowCheckpointMinimumOffsetAdjuster implements WindowCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: WindowCheckpoint, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the window checkpoint steps in order and keeps a trace of each. */
export class WindowCheckpointEngine {
  steps: WindowCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowCheckpoint): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: WindowCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowCheckpointEngine(flagsValue: flags.Registry): WindowCheckpointEngine {
  return new WindowCheckpointEngine(
    [
      new FlaggedWindowCheckpointAdjuster(flagsValue, "window-checkpoint-pending", -0),
      new LocaleWindowCheckpointAdjuster(
        new Map<string, number>([["online", 0.88], ["north", 0.71], ["east", 0.88]]),
      ),
      new TieredWindowCheckpointAdjuster([3517, 6602, 8025], [1.04, 0.82, 0.86]),
      new WindowCheckpointMinimumOffsetAdjuster(0.06),
    ],
    [],
    1.5,
    70580.7,
  );
}
