import * as flags from "../../../../kit/flags.js";
import { GlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

/** One step of the global suppression checkpoint calculation. */
export interface GlobalSuppressionCheckpointFactor {
  describe(): string;
  adjust(item: GlobalSuppressionCheckpoint, value: number): number;
}

export class PercentGlobalSuppressionCheckpointAdjuster implements GlobalSuppressionCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSuppressionCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleGlobalSuppressionCheckpointAdjuster implements GlobalSuppressionCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalSuppressionCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalSuppressionCheckpointAdjuster implements GlobalSuppressionCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSuppressionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalSuppressionCheckpointAdjuster implements GlobalSuppressionCheckpointFactor {
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

  adjust(item: GlobalSuppressionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global suppression checkpoint steps in order and keeps a trace of each. */
export class GlobalSuppressionCheckpointEngine {
  steps: GlobalSuppressionCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSuppressionCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalSuppressionCheckpoint): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: GlobalSuppressionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalSuppressionCheckpointEngine(flagsValue: flags.Registry): GlobalSuppressionCheckpointEngine {
  return new GlobalSuppressionCheckpointEngine(
    [
      new PercentGlobalSuppressionCheckpointAdjuster(-19.9),
      new TitleGlobalSuppressionCheckpointAdjuster(new Map<string, number>([["central", 1.19], ["west", 0.75]])),
      new TieredGlobalSuppressionCheckpointAdjuster([1165, 1693, 6759, 9595], [0.82, 1.04, 1.04, 0.99]),
      new FlaggedGlobalSuppressionCheckpointAdjuster(flagsValue, "global-suppression-checkpoint-regional", 6.1),
    ],
    [],
    1.1,
    53603.6,
  );
}
