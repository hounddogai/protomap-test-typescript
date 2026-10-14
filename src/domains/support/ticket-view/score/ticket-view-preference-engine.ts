import * as flags from "../../../../kit/flags.js";
import { TicketViewPreference } from "./ticket-view-preference.js";

/** One step of the ticket view preference calculation. */
export interface TicketViewPreferenceFactor {
  describe(): string;
  adjust(item: TicketViewPreference, value: number): number;
}

export class TieredTicketViewPreferenceAdjuster implements TicketViewPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTicketViewPreferenceAdjuster implements TicketViewPreferenceFactor {
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

  adjust(item: TicketViewPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTicketViewPreferenceAdjuster implements TicketViewPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTicketViewPreferenceAdjuster implements TicketViewPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the ticket view preference steps in order and keeps a trace of each. */
export class TicketViewPreferenceEngine {
  steps: TicketViewPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewPreference): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: TicketViewPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewPreferenceEngine(flagsValue: flags.Registry): TicketViewPreferenceEngine {
  return new TicketViewPreferenceEngine(
    [
      new TieredTicketViewPreferenceAdjuster([7058, 7642], [0.9, 0.95]),
      new FlaggedTicketViewPreferenceAdjuster(flagsValue, "ticket-view-preference-seasonal", -5.4),
      new PercentTicketViewPreferenceAdjuster(21.7),
      new CapTicketViewPreferenceAdjuster(23677),
    ],
    [],
    3.9,
    72262.3,
  );
}
