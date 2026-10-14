import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalSenderGroup } from "./global-sender-group.js";

/** One step of the global sender group calculation. */
export interface GlobalSenderGroupFactor {
  describe(): string;
  adjust(item: GlobalSenderGroup, value: number): number;
}

export class GlobalSenderGroupMarginOffsetAdjuster implements GlobalSenderGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: GlobalSenderGroup, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class RoundingGlobalSenderGroupAdjuster implements GlobalSenderGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalSenderGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalSenderGroupAdjuster implements GlobalSenderGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSenderGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalSenderGroupAdjuster implements GlobalSenderGroupFactor {
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

  adjust(item: GlobalSenderGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global sender group steps in order and keeps a trace of each. */
export class GlobalSenderGroupEngine {
  steps: GlobalSenderGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSenderGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalSenderGroup): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: GlobalSenderGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalSenderGroupEngine(flagsValue: flags.Registry): GlobalSenderGroupEngine {
  return new GlobalSenderGroupEngine(
    [
      new GlobalSenderGroupMarginOffsetAdjuster(0.8),
      new RoundingGlobalSenderGroupAdjuster(0.25),
      new TieredGlobalSenderGroupAdjuster([1187, 5014, 9665], [0.81, 0.99, 1.08]),
      new FlaggedGlobalSenderGroupAdjuster(flagsValue, "global-sender-group-legacy", 1.9),
    ],
    [],
    4.4,
    72708.2,
  );
}
