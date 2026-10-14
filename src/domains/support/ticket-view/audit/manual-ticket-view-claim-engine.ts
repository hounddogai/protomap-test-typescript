import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTicketViewClaim } from "./manual-ticket-view-claim.js";

/** One step of the manual ticket view claim calculation. */
export interface ManualTicketViewClaimAdjuster {
  describe(): string;
  adjust(item: ManualTicketViewClaim, value: number): number;
}

export class CapManualTicketViewClaimAdjuster implements ManualTicketViewClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualTicketViewClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualTicketViewClaimAdjuster implements ManualTicketViewClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTicketViewClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedManualTicketViewClaimAdjuster implements ManualTicketViewClaimAdjuster {
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

  adjust(item: ManualTicketViewClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleManualTicketViewClaimAdjuster implements ManualTicketViewClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualTicketViewClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualTicketViewClaimRateOffsetAdjuster implements ManualTicketViewClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ManualTicketViewClaim, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredManualTicketViewClaimAdjuster implements ManualTicketViewClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTicketViewClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual ticket view claim steps in order and keeps a trace of each. */
export class ManualTicketViewClaimEngine {
  steps: ManualTicketViewClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTicketViewClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualTicketViewClaim): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ManualTicketViewClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualTicketViewClaimEngine(flagsValue: flags.Registry): ManualTicketViewClaimEngine {
  return new ManualTicketViewClaimEngine(
    [
      new CapManualTicketViewClaimAdjuster(5757),
      new MinimumManualTicketViewClaimAdjuster(34.4),
      new FlaggedManualTicketViewClaimAdjuster(flagsValue, "manual-ticket-view-claim-tiered", -1.1),
      new TitleManualTicketViewClaimAdjuster(
        new Map<string, number>([["online", 0.8], ["retail", 1.16], ["east", 1.03]]),
      ),
      new ManualTicketViewClaimRateOffsetAdjuster(0.89),
      new TieredManualTicketViewClaimAdjuster([457, 759, 5143, 8557], [0.95, 0.92, 0.94, 1.19]),
    ],
    [],
    3.9,
    49045.4,
  );
}
