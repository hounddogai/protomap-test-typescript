import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedSlaCheckpoint } from "./capped-sla-checkpoint.js";

/** One step of the capped sla checkpoint calculation. */
export interface CappedSlaCheckpointFactor {
  describe(): string;
  adjust(item: CappedSlaCheckpoint, value: number): number;
}

export class FlaggedCappedSlaCheckpointAdjuster implements CappedSlaCheckpointFactor {
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

  adjust(item: CappedSlaCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedSlaCheckpointAdjuster implements CappedSlaCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedSlaCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedSlaCheckpointAdjuster implements CappedSlaCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSlaCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleCappedSlaCheckpointAdjuster implements CappedSlaCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CappedSlaCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped sla checkpoint steps in order and keeps a trace of each. */
export class CappedSlaCheckpointEngine {
  steps: CappedSlaCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSlaCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedSlaCheckpoint): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CappedSlaCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedSlaCheckpointEngine(flagsValue: flags.Registry): CappedSlaCheckpointEngine {
  return new CappedSlaCheckpointEngine(
    [
      new FlaggedCappedSlaCheckpointAdjuster(flagsValue, "capped-sla-checkpoint-pending", 8.1),
      new PercentCappedSlaCheckpointAdjuster(5.2),
      new CapCappedSlaCheckpointAdjuster(10722),
      new LocaleCappedSlaCheckpointAdjuster(new Map<string, number>([["west", 0.72], ["north", 1.23]])),
    ],
    [],
    4.9,
    98635.1,
  );
}
