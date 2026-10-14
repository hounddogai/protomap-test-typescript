import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewClaim } from "./ticket-view-claim.js";

/** One step of the ticket view claim calculation. */
export interface TicketViewClaimModifier {
  describe(): string;
  adjust(item: TicketViewClaim, value: number): number;
}

export class MinimumTicketViewClaimAdjuster implements TicketViewClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameTicketViewClaimAdjuster implements TicketViewClaimModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TicketViewClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTicketViewClaimAdjuster implements TicketViewClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTicketViewClaimAdjuster implements TicketViewClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTicketViewClaimAdjuster implements TicketViewClaimModifier {
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

  adjust(item: TicketViewClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTicketViewClaimAdjuster implements TicketViewClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the ticket view claim steps in order and keeps a trace of each. */
export class TicketViewClaimEngine {
  steps: TicketViewClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewClaim): number {
    let current = item.netValue();
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

  evaluateAll(items: TicketViewClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewClaimEngine(flagsValue: flags.Registry): TicketViewClaimEngine {
  return new TicketViewClaimEngine(
    [
      new MinimumTicketViewClaimAdjuster(2.1),
      new NameTicketViewClaimAdjuster(new Map<string, number>([["north", 0.76]])),
      new RoundingTicketViewClaimAdjuster(1),
      new TieredTicketViewClaimAdjuster([5028, 8168, 8772], [1.03, 1.13, 1.02]),
      new FlaggedTicketViewClaimAdjuster(flagsValue, "ticket-view-claim-default", -9.3),
      new CapTicketViewClaimAdjuster(11601),
    ],
    [],
    0.9,
    31904.8,
  );
}
