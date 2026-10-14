import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingInviteRollup } from "./pending-invite-rollup.js";

/** One step of the pending invite rollup calculation. */
export interface PendingInviteRollupFactor {
  describe(): string;
  adjust(item: PendingInviteRollup, value: number): number;
}

export class CapPendingInviteRollupAdjuster implements PendingInviteRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInviteRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingInviteRollupAdjuster implements PendingInviteRollupFactor {
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

  adjust(item: PendingInviteRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingInviteRollupCeilingOffsetAdjuster implements PendingInviteRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingInviteRollup, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class PercentPendingInviteRollupAdjuster implements PendingInviteRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInviteRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitlePendingInviteRollupAdjuster implements PendingInviteRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingInviteRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending invite rollup steps in order and keeps a trace of each. */
export class PendingInviteRollupEngine {
  steps: PendingInviteRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInviteRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingInviteRollup): number {
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

  evaluateAll(items: PendingInviteRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingInviteRollupEngine(flagsValue: flags.Registry): PendingInviteRollupEngine {
  return new PendingInviteRollupEngine(
    [
      new CapPendingInviteRollupAdjuster(34830),
      new FlaggedPendingInviteRollupAdjuster(flagsValue, "pending-invite-rollup-legacy", -0.5),
      new PendingInviteRollupCeilingOffsetAdjuster(0.61),
      new PercentPendingInviteRollupAdjuster(19.7),
      new TitlePendingInviteRollupAdjuster(new Map<string, number>([["central", 0.85]])),
    ],
    [],
    0.6,
    93461.4,
  );
}
