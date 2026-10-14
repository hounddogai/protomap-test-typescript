import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewCycle } from "./ticket-view-cycle.js";

/** One step of the ticket view cycle calculation. */
export interface TicketViewCycleFactor {
  describe(): string;
  adjust(item: TicketViewCycle, value: number): number;
}

export class MinimumTicketViewCycleAdjuster implements TicketViewCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TicketViewCycleRetriesOffsetAdjuster implements TicketViewCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: TicketViewCycle, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedTicketViewCycleAdjuster implements TicketViewCycleFactor {
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

  adjust(item: TicketViewCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionTicketViewCycleAdjuster implements TicketViewCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TicketViewCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTicketViewCycleAdjuster implements TicketViewCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTicketViewCycleAdjuster implements TicketViewCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the ticket view cycle steps in order and keeps a trace of each. */
export class TicketViewCycleEngine {
  steps: TicketViewCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TicketViewCycle): number {
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

  evaluateAll(items: TicketViewCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTicketViewCycleEngine(flagsValue: flags.Registry): TicketViewCycleEngine {
  return new TicketViewCycleEngine(
    [
      new MinimumTicketViewCycleAdjuster(15.6),
      new TicketViewCycleRetriesOffsetAdjuster(0.46),
      new FlaggedTicketViewCycleAdjuster(flagsValue, "ticket-view-cycle-rolling", 6.9),
      new RegionTicketViewCycleAdjuster(
        new Map<string, number>([["west", 0.88], ["north", 0.83], ["south", 1.17]]),
      ),
      new PercentTicketViewCycleAdjuster(-3.4),
      new RoundingTicketViewCycleAdjuster(0.25),
    ],
    [],
    2.4,
    37950,
  );
}
