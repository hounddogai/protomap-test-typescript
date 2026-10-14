import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalTicketViewClaim } from "./global-ticket-view-claim.js";

/** One step of the global ticket view claim calculation. */
export interface GlobalTicketViewClaimFactor {
  describe(): string;
  adjust(item: GlobalTicketViewClaim, value: number): number;
}

export class GlobalTicketViewClaimStartsAtOffsetAdjuster implements GlobalTicketViewClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: GlobalTicketViewClaim, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class UnitGlobalTicketViewClaimAdjuster implements GlobalTicketViewClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: GlobalTicketViewClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedGlobalTicketViewClaimAdjuster implements GlobalTicketViewClaimFactor {
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

  adjust(item: GlobalTicketViewClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalTicketViewClaimAdjuster implements GlobalTicketViewClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalTicketViewClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalTicketViewClaimAdjuster implements GlobalTicketViewClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalTicketViewClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global ticket view claim steps in order and keeps a trace of each. */
export class GlobalTicketViewClaimEngine {
  steps: GlobalTicketViewClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalTicketViewClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalTicketViewClaim): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalTicketViewClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalTicketViewClaimEngine(flagsValue: flags.Registry): GlobalTicketViewClaimEngine {
  return new GlobalTicketViewClaimEngine(
    [
      new GlobalTicketViewClaimStartsAtOffsetAdjuster(1.63),
      new UnitGlobalTicketViewClaimAdjuster(new Map<string, number>([["central", 1.32], ["retail", 0.76]])),
      new FlaggedGlobalTicketViewClaimAdjuster(flagsValue, "global-ticket-view-claim-legacy", -4.7),
      new CapGlobalTicketViewClaimAdjuster(17182),
      new MinimumGlobalTicketViewClaimAdjuster(10.4),
    ],
    [],
    2.2,
    58149.9,
  );
}
