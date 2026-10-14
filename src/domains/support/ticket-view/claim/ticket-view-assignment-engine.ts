import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewAssignment } from "./ticket-view-assignment.js";

/** One step of the ticket view assignment calculation. */
export interface TicketViewAssignmentStep {
  describe(): string;
  adjust(item: TicketViewAssignment, value: number): number;
}

export class RoundingTicketViewAssignmentAdjuster implements TicketViewAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTicketViewAssignmentAdjuster implements TicketViewAssignmentStep {
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

  adjust(item: TicketViewAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTicketViewAssignmentAdjuster implements TicketViewAssignmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the ticket view assignment steps in order and keeps a trace of each. */
export class TicketViewAssignmentEngine {
  steps: TicketViewAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewAssignment): number {
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

  evaluateAll(items: TicketViewAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewAssignmentEngine(flagsValue: flags.Registry): TicketViewAssignmentEngine {
  return new TicketViewAssignmentEngine(
    [
      new RoundingTicketViewAssignmentAdjuster(0.25),
      new FlaggedTicketViewAssignmentAdjuster(flagsValue, "ticket-view-assignment-weighted", 3.2),
      new TieredTicketViewAssignmentAdjuster([2261, 6155, 6168], [1.16, 1.17, 1.05]),
    ],
    [],
    2.3,
    2221,
  );
}
