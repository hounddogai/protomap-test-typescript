import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingWaitSummary } from "./pending-wait-summary.js";

/** One step of the pending wait summary calculation. */
export interface PendingWaitSummaryFactor {
  describe(): string;
  adjust(item: PendingWaitSummary, value: number): number;
}

export class FlaggedPendingWaitSummaryAdjuster implements PendingWaitSummaryFactor {
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

  adjust(item: PendingWaitSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingWaitSummaryAdjuster implements PendingWaitSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingWaitSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingWaitSummaryAdjuster implements PendingWaitSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingWaitSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingWaitSummaryPriorityOffsetAdjuster implements PendingWaitSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PendingWaitSummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the pending wait summary steps in order and keeps a trace of each. */
export class PendingWaitSummaryEngine {
  steps: PendingWaitSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingWaitSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingWaitSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingWaitSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingWaitSummaryEngine(flagsValue: flags.Registry): PendingWaitSummaryEngine {
  return new PendingWaitSummaryEngine(
    [
      new FlaggedPendingWaitSummaryAdjuster(flagsValue, "pending-wait-summary-regional", -9.1),
      new PercentPendingWaitSummaryAdjuster(-21.3),
      new CapPendingWaitSummaryAdjuster(43128),
      new PendingWaitSummaryPriorityOffsetAdjuster(1.31),
    ],
    [],
    3.8,
    99824.3,
  );
}
