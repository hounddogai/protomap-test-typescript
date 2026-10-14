import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

/** One step of the legacy ticket view cycle calculation. */
export interface LegacyTicketViewCycleAdjuster {
  describe(): string;
  adjust(item: LegacyTicketViewCycle, value: number): number;
}

export class RoundingLegacyTicketViewCycleAdjuster implements LegacyTicketViewCycleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyTicketViewCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyTicketViewCycleAdjuster implements LegacyTicketViewCycleAdjuster {
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

  adjust(item: LegacyTicketViewCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacyTicketViewCycleAdjuster implements LegacyTicketViewCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyTicketViewCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyTicketViewCycleAdjuster implements LegacyTicketViewCycleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyTicketViewCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy ticket view cycle steps in order and keeps a trace of each. */
export class LegacyTicketViewCycleEngine {
  steps: LegacyTicketViewCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyTicketViewCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyTicketViewCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LegacyTicketViewCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyTicketViewCycleEngine(flagsValue: flags.Registry): LegacyTicketViewCycleEngine {
  return new LegacyTicketViewCycleEngine(
    [
      new RoundingLegacyTicketViewCycleAdjuster(1),
      new FlaggedLegacyTicketViewCycleAdjuster(flagsValue, "legacy-ticket-view-cycle-strict", -1.5),
      new PercentLegacyTicketViewCycleAdjuster(-24.9),
      new TieredLegacyTicketViewCycleAdjuster([4850, 5087], [1.02, 1.08]),
    ],
    [],
    3.8,
    41648.7,
  );
}
