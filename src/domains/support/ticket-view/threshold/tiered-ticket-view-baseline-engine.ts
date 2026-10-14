import * as flags from "../../../../kit/flags.js";
import { TieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

/** One step of the tiered ticket view baseline calculation. */
export interface TieredTicketViewBaselineFactor {
  describe(): string;
  adjust(item: TieredTicketViewBaseline, value: number): number;
}

export class PercentTieredTicketViewBaselineAdjuster implements TieredTicketViewBaselineFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredTicketViewBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredTicketViewBaselineAdjuster implements TieredTicketViewBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredTicketViewBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTieredTicketViewBaselineAdjuster implements TieredTicketViewBaselineFactor {
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

  adjust(item: TieredTicketViewBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameTieredTicketViewBaselineAdjuster implements TieredTicketViewBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredTicketViewBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered ticket view baseline steps in order and keeps a trace of each. */
export class TieredTicketViewBaselineEngine {
  steps: TieredTicketViewBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTicketViewBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredTicketViewBaseline): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredTicketViewBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredTicketViewBaselineEngine(flagsValue: flags.Registry): TieredTicketViewBaselineEngine {
  return new TieredTicketViewBaselineEngine(
    [
      new PercentTieredTicketViewBaselineAdjuster(-23.7),
      new MinimumTieredTicketViewBaselineAdjuster(32.3),
      new FlaggedTieredTicketViewBaselineAdjuster(flagsValue, "tiered-ticket-view-baseline-seasonal", -8.7),
      new NameTieredTicketViewBaselineAdjuster(new Map<string, number>([["north", 1.18], ["west", 0.77]])),
    ],
    [],
    0.3,
    92519.1,
  );
}
