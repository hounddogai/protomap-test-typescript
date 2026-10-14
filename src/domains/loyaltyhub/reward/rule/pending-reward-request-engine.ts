import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRewardRequest } from "./pending-reward-request.js";

/** One step of the pending reward request calculation. */
export interface PendingRewardRequestFactor {
  describe(): string;
  adjust(item: PendingRewardRequest, value: number): number;
}

export class PendingRewardRequestGraceDaysOffsetAdjuster implements PendingRewardRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PendingRewardRequest, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapPendingRewardRequestAdjuster implements PendingRewardRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRewardRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingRewardRequestAdjuster implements PendingRewardRequestFactor {
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

  adjust(item: PendingRewardRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourcePendingRewardRequestAdjuster implements PendingRewardRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PendingRewardRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending reward request steps in order and keeps a trace of each. */
export class PendingRewardRequestEngine {
  steps: PendingRewardRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingRewardRequest): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PendingRewardRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingRewardRequestEngine(flagsValue: flags.Registry): PendingRewardRequestEngine {
  return new PendingRewardRequestEngine(
    [
      new PendingRewardRequestGraceDaysOffsetAdjuster(0.02),
      new CapPendingRewardRequestAdjuster(15929),
      new FlaggedPendingRewardRequestAdjuster(flagsValue, "pending-reward-request-scheduled", -8.6),
      new UtmSourcePendingRewardRequestAdjuster(
        new Map<string, number>([["north", 1.29], ["west", 0.93], ["central", 1.05]]),
      ),
    ],
    [],
    3.7,
    3829.2,
  );
}
