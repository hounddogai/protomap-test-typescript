import * as flags from "../../../../kit/flags.js";
import { TicketViewMapping } from "./ticket-view-mapping.js";

/** One step of the ticket view mapping calculation. */
export interface TicketViewMappingModifier {
  describe(): string;
  adjust(item: TicketViewMapping, value: number): number;
}

export class FlaggedTicketViewMappingAdjuster implements TicketViewMappingModifier {
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

  adjust(item: TicketViewMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTicketViewMappingAdjuster implements TicketViewMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTicketViewMappingAdjuster implements TicketViewMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the ticket view mapping steps in order and keeps a trace of each. */
export class TicketViewMappingEngine {
  steps: TicketViewMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewMapping): number {
    let current = item.projectedValue();
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

  evaluateAll(items: TicketViewMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewMappingEngine(flagsValue: flags.Registry): TicketViewMappingEngine {
  return new TicketViewMappingEngine(
    [
      new FlaggedTicketViewMappingAdjuster(flagsValue, "ticket-view-mapping-fallback", -9.1),
      new MinimumTicketViewMappingAdjuster(6.3),
      new TieredTicketViewMappingAdjuster([914, 4791], [0.94, 1]),
    ],
    [],
    0,
    51479.6,
  );
}
